import * as departmentRepository from './department.repository.js';
import ApiError from '../../utils/ApiError.js';

// Fetch all departments
export const getAll = async () => departmentRepository.findAll();

// Lightweight department options for dropdowns
export const getOptions = async () => departmentRepository.findOptions();

// Fetch a single department by UUID — throws 404 if missing
export const getByUuid = async (uuid) => {
  const department = await departmentRepository.findByUuid(uuid);
  if (!department) throw ApiError.notFound('Department not found');
  return department;
};

// Create a new department — checks code uniqueness
export const create = async (data) => {
  const existing = await departmentRepository.findByCode(data.code);
  if (existing) throw ApiError.conflict('Department code already exists');
  return departmentRepository.create(data);
};

// Update a department by UUID — checks code uniqueness if changing
export const update = async (uuid, data) => {
  const department = await departmentRepository.findByUuid(uuid);
  if (!department) throw ApiError.notFound('Department not found');

  if (data.code && data.code !== department.code) {
    const existing = await departmentRepository.findByCode(data.code);
    if (existing) throw ApiError.conflict('Department code already exists');
  }
  return department.update(data);
};

// Soft delete a department by UUID — throws 404 if missing
export const deleteRecord = async (uuid) => {
  const deleted = await departmentRepository.deleteRecord(uuid);
  if (!deleted) throw ApiError.notFound('Department not found');
  return { message: 'Department deleted successfully' };
};
