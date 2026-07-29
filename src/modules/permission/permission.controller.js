import permissionService from './permission.service.js';
import ApiResponse from '../../utils/apiResponse.js';
// Fetch all permissions
export const getAllPermissions = async (_req, res, next) => {
  try {
    const permissions = await permissionService.getAll();
    return ApiResponse.success(res, permissions, 'Permissions fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single permission by UUID
export const getPermissionByUuid = async (req, res, next) => {
  try {
    const permission = await permissionService.getByUuid(req.params.uuid);
    return ApiResponse.success(res, permission, 'Permission fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new permission
export const createPermission = async (req, res, next) => {
  try {
    const permission = await permissionService.create(req.body);
    return ApiResponse.created(res, permission, 'Permission created successfully');
  } catch (error) {
    next(error);
  }
};

// Update an existing permission by UUID
export const updatePermission = async (req, res, next) => {
  try {
    const permission = await permissionService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, permission, 'Permission updated successfully');
  } catch (error) {
    next(error);
  }
};

// Soft delete a permission by UUID
export const deletePermission = async (req, res, next) => {
  try {
    const result = await permissionService.delete(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
