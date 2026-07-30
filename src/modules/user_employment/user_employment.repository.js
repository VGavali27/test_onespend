import db from '../../database/models/index.js';
const { UserEmployment } = db;

// Fetch all employments ordered by creation date (newest first)
export const findAll = async () => UserEmployment.findAll({ order: [['createdAt', 'DESC']] });

// Find an employment by UUID
export const findByUuid = async (uuid) => UserEmployment.findOne({ where: { uuid } });

// Find all employments for a given user ID
export const findByUserId = async (userId) =>
  UserEmployment.findAll({ where: { user_id: userId }, order: [['createdAt', 'DESC']] });

// Find an employment by employee code
export const findByEmployeeCode = async (code) => UserEmployment.findOne({ where: { employee_code: code } });

// Create a new employment record
export const create = async (data) => UserEmployment.create(data);

// Update an employment by UUID — returns null if not found
export const update = async (uuid, data) => {
  const employment = await UserEmployment.findOne({ where: { uuid } });
  if (!employment) return null;
  return employment.update(data);
};

// Soft delete an employment by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const employment = await UserEmployment.findOne({ where: { uuid } });
  if (!employment) return false;
  await employment.destroy();
  return true;
};
