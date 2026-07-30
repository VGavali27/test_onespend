import db from '../../database/models/index.js';
const { Permission } = db;

// Fetch all permissions ordered by resource, then action
export const findAll = async () =>
  Permission.findAll({ order: [['resource', 'ASC'], ['action', 'ASC']] });

// Find a permission by its UUID
export const findByUuid = async (uuid) => Permission.findOne({ where: { uuid } });

// Find a permission by its key
export const findByKey = async (permissionKey) => Permission.findOne({ where: { permission_key: permissionKey } });

// Create a new permission record
export const create = async (data) => Permission.create(data);

// Update a permission by UUID — returns null if not found
export const update = async (uuid, data) => {
  const permission = await Permission.findOne({ where: { uuid } });
  if (!permission) return null;
  return permission.update(data);
};

// Soft delete a permission by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const permission = await Permission.findOne({ where: { uuid } });
  if (!permission) return false;
  await permission.destroy();
  return true;
};
