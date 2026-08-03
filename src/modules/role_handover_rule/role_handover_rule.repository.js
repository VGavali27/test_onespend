import db from '../../database/models/index.js';

const { Role, RoleHandoverRule } = db;

// Include role names on every read so the API returns fromRole/toRole
const roleIncludes = [
  { model: Role, as: 'fromRole' },
  { model: Role, as: 'toRole' },
];

// Fetch all rules — optional module filter, newest first
export const findAll = async (module) => {
  const where = module ? { module } : undefined;
  return RoleHandoverRule.findAll({
    where,
    include: roleIncludes,
    order: [['module', 'ASC'], ['createdAt', 'DESC']],
  });
};

// Find a rule by its UUID
export const findByUuid = async (uuid) =>
  RoleHandoverRule.findOne({ where: { uuid }, include: roleIncludes });

// Find an existing transition — for duplicate detection.
// Pass excludeId when updating to ignore the record itself.
export const findByTransition = async (module, fromRoleId, toRoleId, excludeId = null) => {
  const where = { module, from_role_id: fromRoleId, to_role_id: toRoleId };
  if (excludeId) where.id = { [db.Sequelize.Op.ne]: excludeId };
  return RoleHandoverRule.findOne({ where });
};

// Create a new rule record
export const create = async (data) => RoleHandoverRule.create(data);

// All rules a from-role has within a module — for sync (active and inactive)
export const findByFromRole = async (module, fromRoleId) =>
  RoleHandoverRule.findAll({ where: { module, from_role_id: fromRoleId } });

// Update a rule by UUID — returns null if not found
export const update = async (uuid, data) => {
  const rule = await RoleHandoverRule.findOne({ where: { uuid } });
  if (!rule) return null;
  await rule.update(data);
  return findByUuid(uuid);
};

// Soft delete a rule by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const rule = await RoleHandoverRule.findOne({ where: { uuid } });
  if (!rule) return false;
  await rule.destroy();
  return true;
};
