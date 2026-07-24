import { HTTP_STATUS } from '../constants/index.js';

/**
 * Standardized API response helpers.
 *
 * Every response follows the shape:
 * {
 *   success: true|false,
 *   message: "...",
 *   data: {...} | [...],
 *   meta: {...}        // only for paginated
 *   errors: [...]      // only for validation errors
 * }
 */

class ApiResponse {
  // ── Success Responses ──

  /**
   * 200 OK — Generic success
   */
  static success(res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * 201 Created — Resource created
   */
  static created(res, data = null, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, HTTP_STATUS.CREATED);
  }

  /**
   * 200 OK — With pagination metadata
   */
  static paginated(res, data = [], pagination = {}) {
    const { page = 1, limit = 10, total = 0, totalPages = Math.ceil(total / limit) } = pagination;

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Data fetched successfully',
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  }

  /**
   * 204 No Content — Successful deletion
   */
  static noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).json(null);
  }

  // ── Error Responses ──

  /**
   * Generic error response
   */
  static error(res, message = 'Internal Server Error', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) {
    const body = {
      success: false,
      message,
    };

    if (errors) {
      body.errors = Array.isArray(errors) ? errors : [errors];
    }

    return res.status(statusCode).json(body);
  }

  /**
   * 400 Bad Request
   */
  static badRequest(res, message = 'Bad request', errors = null) {
    return ApiResponse.error(res, message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  /**
   * 401 Unauthorized
   */
  static unauthorized(res, message = 'Unauthorized') {
    return ApiResponse.error(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  /**
   * 403 Forbidden
   */
  static forbidden(res, message = 'Forbidden') {
    return ApiResponse.error(res, message, HTTP_STATUS.FORBIDDEN);
  }

  /**
   * 404 Not Found
   */
  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, HTTP_STATUS.NOT_FOUND);
  }

  /**
   * 409 Conflict
   */
  static conflict(res, message = 'Resource already exists') {
    return ApiResponse.error(res, message, HTTP_STATUS.CONFLICT);
  }

  /**
   * 422 Unprocessable Entity — Validation errors
   */
  static validationError(res, errors = [], message = 'Validation failed') {
    const formatted = errors.map((e) => (typeof e === 'string' ? { message: e } : e));
    return ApiResponse.error(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, formatted);
  }
}

export default ApiResponse;
