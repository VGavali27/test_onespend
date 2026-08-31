import * as userService from './user.service.js';
import ApiResponse from '../../utils/apiResponse.js';
// Fetch all users (paginated) — query params: page, limit, search, status, sortBy, sortOrder
export const getAllUsers = async (req, res, next) => {
  try {
    const { rows, total } = await userService.getAll(req.query);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    return ApiResponse.paginated(res, rows, { page, limit, total });
  } catch (error) {
    next(error);
  }
};

// Get the authenticated user's full profile
export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.userUuid);
    return ApiResponse.success(res, profile, 'Profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Get the authenticated user's permissions with all permissions grouped by resource
export const getMyPermissions = async (req, res, next) => {
  try {
    const data = await userService.getMyPermissions(req.user.userUuid);
    return ApiResponse.success(res, data, 'Permissions fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single user by UUID (full profile: role, department, employments)
export const getUserByUuid = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.params.uuid);
    return ApiResponse.success(res, user, 'User fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new user
export const createUser = async (req, res, next) => {
  try {
    const user = await userService.create(req.body);
    return ApiResponse.created(res, user, 'User created successfully');
  } catch (error) {
    next(error);
  }
};

// Update an existing user by UUID
export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

// Soft delete a user by UUID
export const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteRecord(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
