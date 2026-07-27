import db from '../../database/models/index.js';

const { RolePermission, Role, Permission } = db;

class RolePermissionRepository {
  // Find all permission IDs assigned to a role
  async findPermissionIdsByRoleId(roleId) {
    const records = await RolePermission.findAll({
      where: { role_id: roleId },
      attributes: ['permission_id'],
    });
    return records.map((r) => r.permission_id);
  }

  // Find all permissions for a role (eager loaded)
  async findPermissionsByRoleId(roleId) {
    const role = await Role.findByPk(roleId, {
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
    });
    return role ? role.permissions : [];
  }

  // Assign multiple permissions to a role (bulk insert, skips duplicates)
  async assign(roleId, permissionIds) {
    const existing = await this.findPermissionIdsByRoleId(roleId);
    const newIds = permissionIds.filter((pid) => !existing.includes(pid));

    if (newIds.length === 0) return [];

    const records = newIds.map((permissionId) => ({
      role_id: roleId,
      permission_id: permissionId,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await RolePermission.bulkCreate(records);
    return newIds;
  }

  // Revoke multiple permissions from a role
  async revoke(roleId, permissionIds) {
    const deleted = await RolePermission.destroy({
      where: { role_id: roleId, permission_id: permissionIds },
    });
    return deleted;
  }

  // Sync permissions for a role — replaces all existing with the given set
  async sync(roleId, permissionIds) {
    const existingIds = await this.findPermissionIdsByRoleId(roleId);

    const toRemove = existingIds.filter((id) => !permissionIds.includes(id));
    const toAdd = permissionIds.filter((id) => !existingIds.includes(id));

    if (toRemove.length > 0) {
      await RolePermission.destroy({
        where: { role_id: roleId, permission_id: toRemove },
      });
    }

    if (toAdd.length > 0) {
      const records = toAdd.map((permissionId) => ({
        role_id: roleId,
        permission_id: permissionId,
        created_at: new Date(),
        updated_at: new Date(),
      }));
      await RolePermission.bulkCreate(records);
    }

    return { added: toAdd.length, removed: toRemove.length };
  }
}

export default new RolePermissionRepository();
