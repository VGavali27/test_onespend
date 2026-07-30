import * as forexRepository from './travel_forex.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { TravelExpense } = db;

// Fetch all forex entries
export const getAll = async () => forexRepository.findAll();

// Fetch a single forex entry by UUID — throws 404 if missing
export const getByUuid = async (uuid) => {
  const r = await forexRepository.findByUuid(uuid);
  if (!r) throw ApiError.notFound('Forex entry not found');
  return r;
};

// Create a new forex entry — resolves travel expense UUID
export const create = async (data) => {
  const te = await TravelExpense.findOne({ where: { uuid: data.travel_expense_uuid } });
  if (!te) throw ApiError.notFound('Referenced travel expense not found');
  const { travel_expense_uuid, ...clean } = data;
  return forexRepository.create({ ...clean, travel_expense_id: te.id });
};

// Update a forex entry by UUID
export const update = async (uuid, data) => {
  const r = await forexRepository.update(uuid, data);
  if (!r) throw ApiError.notFound('Forex entry not found');
  return r;
};

// Soft delete a forex entry by UUID
export const deleteRecord = async (uuid) => {
  const d = await forexRepository.deleteRecord(uuid);
  if (!d) throw ApiError.notFound('Forex entry not found');
  return { message: 'Forex entry deleted successfully' };
};
