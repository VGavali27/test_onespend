import db from '../../database/models/index.js';
const { TravelExpenseSegment } = db;

// Fetch all segments ordered by creation date (newest first)
export const findAll = async () => TravelExpenseSegment.findAll({ order: [['createdAt', 'DESC']] });

// Find a segment by UUID
export const findByUuid = async (uuid) => TravelExpenseSegment.findOne({ where: { uuid } });

// Find all segments for a given travel expense
export const findByTravelExpenseId = async (travelExpenseId) =>
  TravelExpenseSegment.findAll({ where: { travel_expense_id: travelExpenseId }, order: [['departure_datetime', 'ASC']] });

// Create a new segment record
export const create = async (data) => TravelExpenseSegment.create(data);

// Update a segment by UUID — returns null if not found
export const update = async (uuid, data) => {
  const record = await TravelExpenseSegment.findOne({ where: { uuid } });
  if (!record) return null;
  return record.update(data);
};

// Soft delete a segment by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const record = await TravelExpenseSegment.findOne({ where: { uuid } });
  if (!record) return false;
  await record.destroy();
  return true;
};
