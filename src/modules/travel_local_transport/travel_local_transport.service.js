import * as transportRepository from './travel_local_transport.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { TravelExpense } = db;

// Fetch all local transport records
export const getAll = async () => transportRepository.findAll();

// Fetch a single local transport by UUID — throws 404 if missing
export const getByUuid = async (uuid) => {
  const r = await transportRepository.findByUuid(uuid);
  if (!r) throw ApiError.notFound('Local transport not found');
  return r;
};

// Create a new local transport — resolves travel expense UUID
export const create = async (data) => {
  const te = await TravelExpense.findOne({ where: { uuid: data.travel_expense_uuid } });
  if (!te) throw ApiError.notFound('Referenced travel expense not found');
  const { travel_expense_uuid, ...clean } = data;
  return transportRepository.create({ ...clean, travel_expense_id: te.id });
};

// Update a local transport by UUID
export const update = async (uuid, data) => {
  const r = await transportRepository.update(uuid, data);
  if (!r) throw ApiError.notFound('Local transport not found');
  return r;
};

// Soft delete a local transport by UUID
export const deleteRecord = async (uuid) => {
  const d = await transportRepository.deleteRecord(uuid);
  if (!d) throw ApiError.notFound('Local transport not found');
  return { message: 'Local transport deleted successfully' };
};
