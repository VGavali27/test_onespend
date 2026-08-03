import db from '../../database/models/index.js';
const { Company, Group } = db;

// Fetch all companies ordered by creation date (newest first)
export const findAll = async () =>
  Company.findAll({ order: [['createdAt', 'DESC']], include: [{ model: Group, as: 'group', attributes: ['name'] }] });

// Lightweight dropdown options — only uuid + name
export const findOptions = async () =>
  Company.findAll({ attributes: ['uuid', 'name'], order: [['name', 'ASC']] });

// Find a company by its UUID — includes group so the edit form can prefill group_uuid
export const findByUuid = async (uuid) =>
  Company.findOne({ where: { uuid }, include: [{ model: Group, as: 'group', attributes: ['uuid', 'name'] }] });

// Find a company by its primary key ID
export const findById = async (id) => Company.findByPk(id);

// Find a company by its unique code
export const findByCode = async (code) => Company.findOne({ where: { code } });

// Create a new company record
export const create = async (data) => Company.create(data);

// Update a company by UUID — returns null if not found
export const update = async (uuid, data) => {
  const company = await Company.findOne({ where: { uuid } });
  if (!company) return null;
  return company.update(data);
};

// Soft delete a company by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const company = await Company.findOne({ where: { uuid } });
  if (!company) return false;
  await company.destroy();
  return true;
};
