import * as roleRepository from './role.repository.js';
import ApiError from '../../utils/ApiError.js';

// Fetch all roles
export const getAll = async () => roleRepository.findAll();

// Lightweight role options for dropdowns
export const getOptions = async () => roleRepository.findOptions();

// Fetch a single role by UUID — throws 404 if missing
export const getByUuid = async (uuid) => {
  const role = await roleRepository.findByUuid(uuid);
  if (!role) throw ApiError.notFound('Role not found');
  return role;
};

// Create a new role — checks code uniqueness
export const create = async (data) => {
  const existing = await roleRepository.findByCode(data.code);
  if (existing) throw ApiError.conflict('Role code already exists');
  return roleRepository.create(data);
};

// Update a role by UUID — checks code uniqueness if changing
export const update = async (uuid, data) => {
  const role = await roleRepository.findByUuid(uuid);
  if (!role) throw ApiError.notFound('Role not found');
  if (data.code && data.code !== role.code) {
    const existing = await roleRepository.findByCode(data.code);
    if (existing) throw ApiError.conflict('Role code already exists');
  }
  return role.update(data);
};

// Soft delete a role by UUID — throws 404 if missing
export const deleteRecord = async (uuid) => {
  const deleted = await roleRepository.deleteRecord(uuid);
  if (!deleted) throw ApiError.notFound('Role not found');
  return { message: 'Role deleted successfully' };
};
