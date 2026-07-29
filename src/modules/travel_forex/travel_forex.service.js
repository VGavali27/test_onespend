import * as forexRepository from './travel_forex.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { TravelExpense } = db;

export const getAll = async () => forexRepository.findAll();
export const getByUuid = async (uuid) => {
  const r = await forexRepository.findByUuid(uuid);
  if (!r) throw ApiError.notFound('Forex entry not found');
  return r;
};
export const create = async (data) => {
  const te = await TravelExpense.findOne({ where: { uuid: data.travel_expense_uuid } });
  if (!te) throw ApiError.notFound('Referenced travel expense not found');
  const { travel_expense_uuid, ...clean } = data;
  return forexRepository.create({ ...clean, travel_expense_id: te.id });
};
export const update = async (uuid, data) => {
  const r = await forexRepository.update(uuid, data);
  if (!r) throw ApiError.notFound('Forex entry not found');
  return r;
};
export const deleteRecord = async (uuid) => {
  const d = await forexRepository.deleteRecord(uuid);
  if (!d) throw ApiError.notFound('Forex entry not found');
  return { message: 'Forex entry deleted successfully' };
};
