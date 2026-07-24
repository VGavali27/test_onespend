import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

const errorHandler = (err, req, res, _next) => {
  // Log in development
  if (env.isDev) {
    console.error('✗ Error:', err);
  }

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

  // Joi validation errors (if thrown manually)
  if (err.isJoi) {
    const messages = err.details?.map((d) => ({ field: d.path?.join('.'), message: d.message })) || [];
    return ApiResponse.validationError(res, messages);
  }

  // Unknown / programming errors — don't leak details in production
  const message = env.isProd ? 'Internal Server Error' : err.message;
  return ApiResponse.error(res, message, 500);
};

export default errorHandler;
