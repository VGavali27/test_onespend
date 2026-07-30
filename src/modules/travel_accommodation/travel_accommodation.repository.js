import db from '../../database/models/index.js';
const { TravelExpenseAccommodation } = db;

// Fetch all accommodations ordered by creation date (newest first)
export const findAll = async () => TravelExpenseAccommodation.findAll({ order: [['createdAt', 'DESC']] });

// Find an accommodation by UUID
export const findByUuid = async (uuid) => TravelExpenseAccommodation.findOne({ where: { uuid } });

// Create a new accommodation record
export const create = async (data) => TravelExpenseAccommodation.create(data);

// Update an accommodation by UUID — returns null if not found
export const update = async (uuid, data) => {
  const r = await TravelExpenseAccommodation.findOne({ where: { uuid } });
  if (!r) return null;
  return r.update(data);
};

// Soft delete an accommodation by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const r = await TravelExpenseAccommodation.findOne({ where: { uuid } });
  if (!r) return false;
  await r.destroy();
  return true;
};
