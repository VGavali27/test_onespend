import * as roleHandoverRuleRepository from './role_handover_rule.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';

const { Role } = db;

// Resolve a role UUID to its internal id — throws 404 if missing
const resolveRoleId = async (uuid, label) => {
  const role = await Role.findOne({ where: { uuid } });
  if (!role) throw ApiError.notFound(`${label} not found`);
  return role.id;
};

// Fetch all rules — optional module filter
export const getAll = async (module) => roleHandoverRuleRepository.findAll(module);

// Fetch a single rule by UUID — throws 404 if missing
export const getByUuid = async (uuid) => {
  const rule = await roleHandoverRuleRepository.findByUuid(uuid);
  if (!rule) throw ApiError.notFound('Rule not found');
  return rule;
};

// Create a new rule — resolves role UUIDs and rejects duplicate transitions
export const create = async (data) => {
  const fromRoleId = await resolveRoleId(data.from_role_uuid, 'From role');
  const toRoleId = await resolveRoleId(data.to_role_uuid, 'To role');

  const duplicate = await roleHandoverRuleRepository.findByTransition(data.module, fromRoleId, toRoleId);
  if (duplicate) throw ApiError.conflict('This handover rule already exists');

  const rule = await roleHandoverRuleRepository.create({
    module: data.module,
    from_role_id: fromRoleId,
    to_role_id: toRoleId,
    status: data.status || 'ACTIVE',
  });

  return roleHandoverRuleRepository.findByUuid(rule.uuid);
};

// Update a rule by UUID — resolves role UUIDs and checks duplicates excluding self
export const update = async (uuid, data) => {
  const existing = await roleHandoverRuleRepository.findByUuid(uuid);
  if (!existing) throw ApiError.notFound('Rule not found');

  const resolved = { ...data };
  if (resolved.from_role_uuid) {
    resolved.from_role_id = await resolveRoleId(resolved.from_role_uuid, 'From role');
    delete resolved.from_role_uuid;
  }
  if (resolved.to_role_uuid) {
    resolved.to_role_id = await resolveRoleId(resolved.to_role_uuid, 'To role');
    delete resolved.to_role_uuid;
  }

  const module = resolved.module ?? existing.module;
  const fromRoleId = resolved.from_role_id ?? existing.from_role_id;
  const toRoleId = resolved.to_role_id ?? existing.to_role_id;

  const duplicate = await roleHandoverRuleRepository.findByTransition(module, fromRoleId, toRoleId, existing.id);
  if (duplicate) throw ApiError.conflict('This handover rule already exists');

  return roleHandoverRuleRepository.update(uuid, resolved);
};

// Soft delete a rule by UUID — throws 404 if missing
export const deleteRecord = async (uuid) => {
  const deleted = await roleHandoverRuleRepository.deleteRecord(uuid);
  if (!deleted) throw ApiError.notFound('Rule not found');
  return { message: 'Rule deleted successfully' };
};

// Sync a from-role's rules within a module.
// Never deletes rows. Rules in the to-role set become ACTIVE (created if absent);
// existing rules left out of the set become INACTIVE.
export const sync = async (module, fromRoleUuid, toRoleUuids) => {
  const fromRoleId = await resolveRoleId(fromRoleUuid, 'From role');

  const toRoles = toRoleUuids.length > 0 ? await Role.findAll({ where: { uuid: toRoleUuids } }) : [];
  if (toRoles.length !== toRoleUuids.length) {
    throw ApiError.badRequest('One or more target role UUIDs are invalid');
  }
  const toRoleIds = toRoles.map((r) => r.id);

  const existing = await roleHandoverRuleRepository.findByFromRole(module, fromRoleId);
  const existingById = new Map(existing.map((r) => [r.to_role_id, r]));

  let activated = 0;
  let deactivated = 0;

  // Every requested to-role must be ACTIVE — create it if it never existed
  for (const toId of toRoleIds) {
    const rec = existingById.get(toId);
    if (!rec) {
      await roleHandoverRuleRepository.create({
        module,
        from_role_id: fromRoleId,
        to_role_id: toId,
        status: 'ACTIVE',
      });
      activated += 1;
    } else if (rec.status !== 'ACTIVE') {
      await rec.update({ status: 'ACTIVE' });
      activated += 1;
    }
  }

  // Existing rules left out of the set → INACTIVE (kept, not deleted)
  for (const rec of existing) {
    if (!toRoleIds.includes(rec.to_role_id) && rec.status !== 'INACTIVE') {
      await rec.update({ status: 'INACTIVE' });
      deactivated += 1;
    }
  }

  return {
    message: `Rules synced: ${activated} activated, ${deactivated} deactivated`,
    added: activated,
    removed: deactivated,
  };
};
