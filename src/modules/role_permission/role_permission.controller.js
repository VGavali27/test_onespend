import rolePermissionService from './role_permission.service.js';
import ApiResponse from '../../utils/apiResponse.js';

// Get all permissions assigned to a role
export const getPermissionsByRole = async (req, res, next) => {
  try {
    const permissions = await rolePermissionService.getPermissionsByRoleUuid(req.params.roleUuid);
    return ApiResponse.success(res, permissions, 'Permissions fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Sync permissions for a role — replaces all existing with the given set
export const syncPermissions = async (req, res, next) => {
  try {
    const result = await rolePermissionService.sync(req.params.roleUuid, req.body);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};
