import * as userService from './user.service.js';
import ApiResponse from '../../utils/apiResponse.js';
// Fetch all users
export const getAllUsers = async (_req, res, next) => {
  try {
    const users = await userService.getAll();
    return ApiResponse.success(res, users, 'Users fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single user by UUID
export const getUserByUuid = async (req, res, next) => {
  try {
    const user = await userService.getByUuid(req.params.uuid);
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
    const result = await userService.delete(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
