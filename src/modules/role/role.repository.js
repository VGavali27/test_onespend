import db from '../../database/models/index.js';
const { Role } = db;

// Fetch all roles ordered by level (highest first), then creation date
export const findAll = async () =>
  Role.findAll({ order: [['level', 'ASC'], ['createdAt', 'DESC']] });

// Lightweight dropdown options — only uuid + name
export const findOptions = async () =>
  Role.findAll({ attributes: ['uuid', 'name'], order: [['level', 'ASC'], ['name', 'ASC']] });

// Find a role by its UUID
export const findByUuid = async (uuid) => Role.findOne({ where: { uuid } });

// Find a role by its unique code
export const findByCode = async (code) => Role.findOne({ where: { code } });

// Create a new role record
export const create = async (data) => Role.create(data);

// Update a role by UUID — returns null if not found
export const update = async (uuid, data) => {
  const role = await Role.findOne({ where: { uuid } });
  if (!role) return null;
  return role.update(data);
};

// Soft delete a role by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const role = await Role.findOne({ where: { uuid } });
  if (!role) return false;
  await role.destroy();
  return true;
};
