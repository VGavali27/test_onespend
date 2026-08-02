import db from '../../database/models/index.js';
const { Department } = db;

// Fetch all departments ordered by creation date
export const findAll = async () => Department.findAll({ order: [['createdAt', 'DESC']] });

// Lightweight dropdown options — only uuid + name
export const findOptions = async () =>
  Department.findAll({ attributes: ['uuid', 'name'], order: [['name', 'ASC']] });

// Find a department by its UUID
export const findByUuid = async (uuid) => Department.findOne({ where: { uuid } });

// Find a department by its unique code
export const findByCode = async (code) => Department.findOne({ where: { code } });

// Create a new department record
export const create = async (data) => Department.create(data);

// Update a department by UUID — returns null if not found
export const update = async (uuid, data) => {
  const department = await Department.findOne({ where: { uuid } });
  if (!department) return null;
  return department.update(data);
};

// Soft delete a department by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const department = await Department.findOne({ where: { uuid } });
  if (!department) return false;
  await department.destroy();
  return true;
};
