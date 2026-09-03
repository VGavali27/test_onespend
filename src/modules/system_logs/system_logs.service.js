import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ApiError from '../../utils/ApiError.js';
import env from '../../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Root log directory — must match src/utils/logger.js (LOG_DIR default 'logs').
// logger.js lives in src/utils (2 levels up → backend/); this file lives in
// src/modules/system_logs (3 levels up → backend/).
const LOG_ROOT = env.logDir
  ? path.resolve(__dirname, '../../..', env.logDir)
  : path.resolve(__dirname, '../../../logs');

const pad = (n) => String(n).padStart(2, '0');

// List dates that have log files, newest first: [{ date: 'YYYY-MM-DD', path }]
export const listLogDates = async () => {
  if (!fs.existsSync(LOG_ROOT)) return [];
  const years = fs.readdirSync(LOG_ROOT).filter((n) => /^\d{4}$/.test(n));
  const dates = [];
  for (const y of years) {
    const yPath = path.join(LOG_ROOT, y);
    for (const m of fs.readdirSync(yPath).filter((n) => /^\d{2}$/.test(n))) {
      const mPath = path.join(yPath, m);
      for (const d of fs.readdirSync(mPath).filter((n) => /^\d{2}$/.test(n))) {
        dates.push(`${y}-${m}-${d}`);
      }
    }
  }
  return dates.sort((a, b) => b.localeCompare(a)); // newest first
};

// Parse a single log line into { timestamp, level, message }.
const parseLine = (line) => {
  const raw = String(line);
  const match = raw.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[([A-Z]+)\]: (.*)$/s);
  if (!match) return { timestamp: null, level: null, message: raw };
  const stacked = match[3];
  // The stack follows immediately on following lines; we capture it in message below.
  return { timestamp: match[1], level: match[2].toLowerCase(), message: stacked };
};

const readFile = (folder, name) => {
  const file = path.join(folder, name);
  if (!fs.existsSync(file)) return [];
  const content = fs.readFileSync(file, 'utf8');
  // Merge a stack line(s) that follow a log header into the message line.
  const lines = content.split(/\r?\n/);
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const entry = parseLine(lines[i]);
    if (entry.timestamp) {
      // consume following indented stack lines
      while (i + 1 < lines.length && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} /.test(lines[i + 1]) && lines[i + 1].trim()) {
        entry.message += `\n${lines[i + 1]}`;
        i++;
      }
      entries.push(entry);
    } else {
      entries.push({ timestamp: null, level: null, message: lines[i] });
    }
  }
  return entries;
};

// File names for each log type.
const FILE_BY_TYPE = { api: 'api.log', error: 'error.log' };

// Resolve a date string into a folder path, throwing on malformed dates.
const folderForDate = (date) => {
  const m = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw ApiError.badRequest('Invalid date. Expected YYYY-MM-DD');
  return path.join(LOG_ROOT, m[1], m[2], m[3]);
};

// Read a specific date's log files. Returns { date, error: [...], api: [...] }.
export const getLogsForDate = async (date) => {
  const folder = folderForDate(date);
  if (!fs.existsSync(folder)) {
    throw ApiError.notFound('No logs available for the given date');
  }
  return {
    date,
    error: readFile(folder, 'error.log'),
    api: readFile(folder, 'api.log'),
  };
};

// Read a single log file for a date. type is 'api' | 'error'.
export const getLogsForType = async (date, type) => {
  const file = FILE_BY_TYPE[type];
  if (!file) throw ApiError.badRequest('Invalid log type. Expected "api" or "error"');
  const folder = folderForDate(date);
  if (!fs.existsSync(folder)) {
    throw ApiError.notFound('No logs available for the given date');
  }
  return {
    date,
    type,
    entries: readFile(folder, file),
  };
};