import db from '../../database/models/index.js';
const { TravelExpenseLocalTransport } = db;

// Fetch all local transports ordered by creation date (newest first)
export const findAll = async () => TravelExpenseLocalTransport.findAll({ order: [['createdAt', 'DESC']] });

// Find a local transport by UUID
export const findByUuid = async (uuid) => TravelExpenseLocalTransport.findOne({ where: { uuid } });

// Create a new local transport record
export const create = async (data) => TravelExpenseLocalTransport.create(data);

// Update a local transport by UUID — returns null if not found
export const update = async (uuid, data) => {
  const r = await TravelExpenseLocalTransport.findOne({ where: { uuid } });
  if (!r) return null;
  return r.update(data);
};

// Soft delete a local transport by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const r = await TravelExpenseLocalTransport.findOne({ where: { uuid } });
  if (!r) return false;
  await r.destroy();
  return true;
};
