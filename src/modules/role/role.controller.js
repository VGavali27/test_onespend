import roleService from './role.service.js';
import ApiResponse from '../../utils/apiResponse.js';

// Fetch all roles
export const getAllRoles = async (_req, res, next) => {
  try {
    const roles = await roleService.getAll();
    return ApiResponse.success(res, roles, 'Roles fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single role by UUID
export const getRoleByUuid = async (req, res, next) => {
  try {
    const role = await roleService.getByUuid(req.params.uuid);
    return ApiResponse.success(res, role, 'Role fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new role
export const createRole = async (req, res, next) => {
  try {
    const role = await roleService.create(req.body);
    return ApiResponse.created(res, role, 'Role created successfully');
  } catch (error) {
    next(error);
  }
};

// Update an existing role by UUID
export const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, role, 'Role updated successfully');
  } catch (error) {
    next(error);
  }
};

// Soft delete a role by UUID
export const deleteRole = async (req, res, next) => {
  try {
    const result = await roleService.delete(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
