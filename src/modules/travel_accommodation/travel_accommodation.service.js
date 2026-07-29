import * as accommodationRepository from './travel_accommodation.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { TravelExpense } = db;

export const getAll = async () => accommodationRepository.findAll();
export const getByUuid = async (uuid) => {
  const r = await accommodationRepository.findByUuid(uuid);
  if (!r) throw ApiError.notFound('Accommodation not found');
  return r;
};
export const create = async (data) => {
  const te = await TravelExpense.findOne({ where: { uuid: data.travel_expense_uuid } });
  if (!te) throw ApiError.notFound('Referenced travel expense not found');
  const { travel_expense_uuid, ...clean } = data;
  return accommodationRepository.create({ ...clean, travel_expense_id: te.id });
};
export const update = async (uuid, data) => {
  const r = await accommodationRepository.update(uuid, data);
  if (!r) throw ApiError.notFound('Accommodation not found');
  return r;
};
export const deleteRecord = async (uuid) => {
  const d = await accommodationRepository.deleteRecord(uuid);
  if (!d) throw ApiError.notFound('Accommodation not found');
  return { message: 'Accommodation deleted successfully' };
};
