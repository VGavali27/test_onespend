import * as miscRepository from './travel_misc_expense.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { TravelExpense } = db;

// Fetch all misc expenses
export const getAll = async () => miscRepository.findAll();

// Fetch a single misc expense by UUID — throws 404 if missing
export const getByUuid = async (uuid) => {
  const r = await miscRepository.findByUuid(uuid);
  if (!r) throw ApiError.notFound('Misc expense not found');
  return r;
};

// Create a new misc expense — resolves travel expense UUID
export const create = async (data) => {
  const te = await TravelExpense.findOne({ where: { uuid: data.travel_expense_uuid } });
  if (!te) throw ApiError.notFound('Referenced travel expense not found');
  const { travel_expense_uuid, ...clean } = data;
  return miscRepository.create({ ...clean, travel_expense_id: te.id });
};

// Update a misc expense by UUID
export const update = async (uuid, data) => {
  const r = await miscRepository.update(uuid, data);
  if (!r) throw ApiError.notFound('Misc expense not found');
  return r;
};

// Soft delete a misc expense by UUID
export const deleteRecord = async (uuid) => {
  const d = await miscRepository.deleteRecord(uuid);
  if (!d) throw ApiError.notFound('Misc expense not found');
  return { message: 'Misc expense deleted successfully' };
};
