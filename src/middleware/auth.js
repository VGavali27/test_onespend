import jwt from 'jsonwebtoken';
import db from '../database/models/index.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

const { Role, Permission } = db;

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

// Require that the user's role has at least one of the given permission keys
// (role_permissions → permissions). Asynchronous — loads the role's permissions from DB.
export const requirePermission = (...keys) => async (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
  }
  try {
    const role = await Role.findByPk(req.user.roleId, {
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
    });
    const granted = role?.permissions?.length
      ? role.permissions.some((p) => keys.includes(p.permission_key))
      : false;
    if (!granted) {
      return next(new ApiError(HTTP_STATUS.FORBIDDEN, 'Insufficient permissions'));
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
