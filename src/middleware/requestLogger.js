import logger from '../utils/logger.js';

// Paths whose own request traffic should NOT be written to api.log, otherwise
// viewing the logs page would fill the API log with its own GET /system/logs* calls.
// Notifications are also excluded because the bell polls count + feed every 30s,
// which would spam api.log with near-identical GET /notifications* lines.
const SKIP_PREFIXES = ['/api/v1/system/logs', '/api/v1/notifications'];

// Log every incoming API request at http level: method, path, status, duration,
// and (when available) the acting user.
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (SKIP_PREFIXES.some((p) => req.originalUrl.startsWith(p))) return;
    const duration = Date.now() - start;
    const user = req.user
      ? ` | user=${req.user.userUuid || req.user.userId || req.user.email || '?'} role=${req.user.roleCode || req.user.role || '?'}`
      : '';
    logger.http(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms${user}`,
    );
  });
  next();
};

export default requestLogger;