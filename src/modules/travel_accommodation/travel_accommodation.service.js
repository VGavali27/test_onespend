import * as accommodationRepository from './travel_accommodation.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { TravelExpense } = db;

// Fetch all accommodations
export const getAll = async () => accommodationRepository.findAll();

// Fetch a single accommodation by UUID — throws 404 if missing
export const getByUuid = async (uuid) => {
  const r = await accommodationRepository.findByUuid(uuid);
  if (!r) throw ApiError.notFound('Accommodation not found');
  return r;
};

// Create a new accommodation — resolves travel expense UUID
export const create = async (data) => {
  const te = await TravelExpense.findOne({ where: { uuid: data.travel_expense_uuid } });
  if (!te) throw ApiError.notFound('Referenced travel expense not found');
  const { travel_expense_uuid, ...clean } = data;
  return accommodationRepository.create({ ...clean, travel_expense_id: te.id });
};

// Update an accommodation by UUID
export const update = async (uuid, data) => {
  const r = await accommodationRepository.update(uuid, data);
  if (!r) throw ApiError.notFound('Accommodation not found');
  return r;
};

// Soft delete an accommodation by UUID
export const deleteRecord = async (uuid) => {
  const d = await accommodationRepository.deleteRecord(uuid);
  if (!d) throw ApiError.notFound('Accommodation not found');
  return { message: 'Accommodation deleted successfully' };
};
