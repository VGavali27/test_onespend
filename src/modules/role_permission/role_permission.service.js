import * as rolePermissionRepository from './role_permission.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { Role, Permission } = db;

// Get all permissions assigned to a role (by role UUID)
export const getPermissionsByRoleUuid = async (roleUuid) => {
  const role = await Role.findOne({ where: { uuid: roleUuid } });
  if (!role) throw ApiError.notFound('Role not found');
  return rolePermissionRepository.findPermissionsByRoleId(role.id);
};

// Sync permissions — replaces all existing with the given set
export const sync = async (roleUuid, permissionUuids) => {
  const role = await Role.findOne({ where: { uuid: roleUuid } });
  if (!role) throw ApiError.notFound('Referenced role not found');

  const permissions = permissionUuids.length > 0 ? await Permission.findAll({ where: { uuid: permissionUuids } }) : [];

  if (permissions.length !== permissionUuids.length) {
    throw ApiError.badRequest('One or more permission UUIDs are invalid');
  }

  const permissionIds = permissions.map((p) => p.id);
  const result = await rolePermissionRepository.sync(role.id, permissionIds);
  return {
    message: `Permissions synced: ${result.added} added, ${result.removed} removed`,
    added: result.added,
    removed: result.removed,
  };
};
