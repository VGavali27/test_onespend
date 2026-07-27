import rolePermissionRepository from './role_permission.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';

const { Role, Permission } = db;

class RolePermissionService {
  // Get all permissions assigned to a role (by role UUID)
  async getPermissionsByRoleUuid(roleUuid) {
    const role = await Role.findOne({ where: { uuid: roleUuid } });
    if (!role) throw ApiError.notFound('Role not found');

    return rolePermissionRepository.findPermissionsByRoleId(role.id);
  }

  // Sync permissions for a role — replaces all existing with the given set
  async sync(roleUuid, permissionUuids) {
    const role = await Role.findOne({ where: { uuid: roleUuid } });
    if (!role) throw ApiError.notFound('Referenced role not found');

    // Resolve permission UUIDs to IDs (empty array = remove all)
    const permissions = permissionUuids.length > 0
      ? await Permission.findAll({ where: { uuid: permissionUuids } })
      : [];

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
  }
}

export default new RolePermissionService();
