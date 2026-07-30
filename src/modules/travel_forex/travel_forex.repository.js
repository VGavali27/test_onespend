import db from '../../database/models/index.js';
const { TravelExpenseForex } = db;

// Fetch all forex entries ordered by creation date (newest first)
export const findAll = async () => TravelExpenseForex.findAll({ order: [['createdAt', 'DESC']] });

// Find a forex entry by UUID
export const findByUuid = async (uuid) => TravelExpenseForex.findOne({ where: { uuid } });

// Create a new forex entry
export const create = async (data) => TravelExpenseForex.create(data);

// Update a forex entry by UUID — returns null if not found
export const update = async (uuid, data) => {
  const r = await TravelExpenseForex.findOne({ where: { uuid } });
  if (!r) return null;
  return r.update(data);
};

// Soft delete a forex entry by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const r = await TravelExpenseForex.findOne({ where: { uuid } });
  if (!r) return false;
  await r.destroy();
  return true;
};
