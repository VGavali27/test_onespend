import { HTTP_STATUS } from '../constants/index.js';

class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = null;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  withErrors(errors) {
    this.errors = errors;
    return this;
  }

  // ── Convenience factory methods ──

  static badRequest(msg = 'Bad request') {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, msg);
  }

  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, msg);
  }

  static forbidden(msg = 'Forbidden') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, msg);
  }

  static notFound(msg = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, msg);
  }

  static conflict(msg = 'Resource already exists') {
    return new ApiError(HTTP_STATUS.CONFLICT, msg);
  }

  static validation(errors, msg = 'Validation failed') {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, msg).withErrors(errors);
  }

  static internal(msg = 'Internal server error') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, msg);
  }
}

export default ApiError;
