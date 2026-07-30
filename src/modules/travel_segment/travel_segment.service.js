import * as segmentRepository from './travel_segment.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { TravelExpense } = db;

// Fetch all segments
export const getAll = async () => segmentRepository.findAll();

// Fetch a single segment by UUID — throws 404 if missing
export const getByUuid = async (uuid) => {
  const r = await segmentRepository.findByUuid(uuid);
  if (!r) throw ApiError.notFound('Segment not found');
  return r;
};

// Create a new segment — resolves travel expense UUID
export const create = async (data) => {
  const te = await TravelExpense.findOne({ where: { uuid: data.travel_expense_uuid } });
  if (!te) throw ApiError.notFound('Referenced travel expense not found');
  const { travel_expense_uuid, ...clean } = data;
  return segmentRepository.create({ ...clean, travel_expense_id: te.id });
};

// Update a segment by UUID
export const update = async (uuid, data) => {
  const r = await segmentRepository.update(uuid, data);
  if (!r) throw ApiError.notFound('Segment not found');
  return r;
};

// Soft delete a segment by UUID
export const deleteRecord = async (uuid) => {
  const d = await segmentRepository.deleteRecord(uuid);
  if (!d) throw ApiError.notFound('Segment not found');
  return { message: 'Segment deleted successfully' };
};
