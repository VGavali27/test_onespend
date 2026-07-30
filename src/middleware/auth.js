import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

// Verify JWT token from Authorization header
export const authMiddleware = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Access denied. No token provided.'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Token expired'));
    }
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token'));
  }
};

// Optional auth — attaches user if token present, but doesn't block
export const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, env.jwt.secret);
    }
  } catch {
    // Ignore errors — user stays unauthenticated
  }
  next();
};

// Require a specific role or roles
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
  }
  if (!roles.includes(req.user.roleCode)) {
    return next(new ApiError(HTTP_STATUS.FORBIDDEN, 'Insufficient permissions'));
  }
  next();
};
