import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, _next) => {
  // Log with request context — always to error.log (stacks included).
  const actor = req.user
    ? ` user=${req.user.userUuid || req.user.userId || '?'} route=${req.method} ${req.originalUrl}`
    : ` route=${req.method} ${req.originalUrl}`;
  logger.error(`Request error${actor}: ${err.message}`, { stack: err?.stack });

  // Known operational error — send structured response
  if (err instanceof ApiError && err.isOperational) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors?.map((e) => ({ field: e.path, message: e.message })) || [];
    return ApiResponse.validationError(res, messages, 'Database validation failed');
  }

  // Sequelize foreign key error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return ApiResponse.error(res, 'Related record not found', 409);
  }

  // Unknown / programming errors — don't leak details in production
  const message = env.isProd ? 'Internal Server Error' : err.message;
  return ApiResponse.error(res, message, 500);
};

export default errorHandler;
