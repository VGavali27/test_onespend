import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import env from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Root log directory — default to <project>/logs, overridable via LOG_DIR.
const LOG_ROOT = env.logDir
  ? path.resolve(__dirname, '../..', env.logDir)
  : path.resolve(__dirname, '../../logs');

// ── Custom transport: writes one file per day into logs/YYYY/MM/DD/ ──────────
// Each transport instance owns a single named file (e.g. error.log / api.log)
// inside the current year/month/day folder. When the local date changes, we
// close the old stream and open a fresh path, so logs are bucketed by day.

const pad = (n) => String(n).padStart(2, '0');

class DailyFolderFile extends winston.Transport {
  constructor(opts = {}) {
    super(opts);
    this.name = opts.filename || 'app.log';
    this.dateKey = null;
    this.stream = null;
  }

  _dateKey(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  _folder(d) {
    return path.join(LOG_ROOT, String(d.getFullYear()), pad(d.getMonth() + 1), pad(d.getDate()));
  }

  _open(d) {
    const key = this._dateKey(d);
    const folder = this._folder(d);
    fs.mkdirSync(folder, { recursive: true });
    const filePath = path.join(folder, this.name);
    this.stream = fs.createWriteStream(filePath, { flags: 'a' });
    this.stream.on('error', (e) => console.error('Logger stream error:', e.message));
    this.dateKey = key;
  }

  _ensure(d) {
    if (!this.stream || this._dateKey(d) !== this.dateKey) this._open(d);
  }

  log(info, callback) {
    const d = new Date();
    this._ensure(d);
    const line =
      typeof info[Symbol.for('message')] === 'string'
        ? info[Symbol.for('message')]
        : JSON.stringify(info);
    this.stream.write(`${line}\n`);
    callback?.();
  }
}

// ── Format helpers ────────────────────────────────────────────────────────────

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...rest }) => {
    const meta = Object.keys(rest).length ? ` | ${JSON.stringify(rest)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message}${meta}${stackStr}`;
  }),
);

// onlyLevel(format, level, ...levels) — restrict a transport to exactly the
// given npm level(s). winston routes `level >= configured` to a transport by
// default, so without this the api.log transport would also capture info/warn/error.
const onlyLevel = (format, ...levels) =>
  winston.format.combine(
    winston.format((info) => (levels.includes(info.level) ? info : false))(),
    format,
  );

// Console — colorized, all levels up to the configured threshold.
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(winston.format.colorize({ all: true }), baseFormat),
});

// Error file transport — logs/YYYY/MM/DD/error.log (error + warn, with stacks).
const errorFileTransport = new DailyFolderFile({
  name: 'error.log',
  level: 'warn',
  filename: 'error.log',
  format: onlyLevel(baseFormat, 'error', 'warn'),
});

// API/HTTP transport — logs/YYYY/MM/DD/api.log (http level ONLY: request traffic).
const apiFileTransport = new DailyFolderFile({
  name: 'api.log',
  level: 'http',
  filename: 'api.log',
  format: onlyLevel(baseFormat, 'http'),
});

const logger = winston.createLogger({
  level: env.logLevel,
  levels: winston.config.npm.levels,
  format: baseFormat,
  transports: [consoleTransport, errorFileTransport, apiFileTransport],
  exitOnError: false,
});

// Silence request logging unless a file/console picks it up — http is below the
// default console threshold in prod, but the api.log transport always captures it.
logger.http = (message, meta) => logger.log('http', message, meta);

export default logger;