import db from '../../database/models/index.js';
const { TravelExpenseMiscExpense } = db;

// Fetch all misc expenses ordered by creation date (newest first)
export const findAll = async () => TravelExpenseMiscExpense.findAll({ order: [['createdAt', 'DESC']] });

// Find a misc expense by UUID
export const findByUuid = async (uuid) => TravelExpenseMiscExpense.findOne({ where: { uuid } });

// Create a new misc expense record
export const create = async (data) => TravelExpenseMiscExpense.create(data);

// Update a misc expense by UUID — returns null if not found
export const update = async (uuid, data) => {
  const r = await TravelExpenseMiscExpense.findOne({ where: { uuid } });
  if (!r) return null;
  return r.update(data);
};

// Soft delete a misc expense by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const r = await TravelExpenseMiscExpense.findOne({ where: { uuid } });
  if (!r) return false;
  await r.destroy();
  return true;
};
