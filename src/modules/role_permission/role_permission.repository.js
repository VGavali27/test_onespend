import db from '../../database/models/index.js';
const { RolePermission, Role, Permission } = db;

export const findPermissionIdsByRoleId = async (roleId) => {
  const records = await RolePermission.findAll({ where: { role_id: roleId }, attributes: ['permission_id'] });
  return records.map((r) => r.permission_id);
};

export const findPermissionsByRoleId = async (roleId) => {
  const role = await Role.findByPk(roleId, {
    include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
  });
  return role ? role.permissions : [];
};

export const assign = async (roleId, permissionIds) => {
  const existing = await findPermissionIdsByRoleId(roleId);
  const newIds = permissionIds.filter((pid) => !existing.includes(pid));
  if (newIds.length === 0) return [];
  const records = newIds.map((permissionId) => ({
    role_id: roleId, permission_id: permissionId, created_at: new Date(), updated_at: new Date(),
  }));
  await RolePermission.bulkCreate(records);
  return newIds;
};

export const revoke = async (roleId, permissionIds) => {
  const deleted = await RolePermission.destroy({ where: { role_id: roleId, permission_id: permissionIds } });
  return deleted;
};

export const sync = async (roleId, permissionIds) => {
  const existingIds = await findPermissionIdsByRoleId(roleId);
  const toRemove = existingIds.filter((id) => !permissionIds.includes(id));
  const toAdd = permissionIds.filter((id) => !existingIds.includes(id));
  if (toRemove.length > 0) {
    await RolePermission.destroy({ where: { role_id: roleId, permission_id: toRemove } });
  }
  if (toAdd.length > 0) {
    const records = toAdd.map((permissionId) => ({
      role_id: roleId, permission_id: permissionId, created_at: new Date(), updated_at: new Date(),
    }));
    await RolePermission.bulkCreate(records);
  }
  return { added: toAdd.length, removed: toRemove.length };
};
