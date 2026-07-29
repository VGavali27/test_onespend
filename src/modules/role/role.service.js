import * as roleRepository from './role.repository.js';
import ApiError from '../../utils/ApiError.js';

export const getAll = async () => roleRepository.findAll();

export const getByUuid = async (uuid) => {
  const role = await roleRepository.findByUuid(uuid);
  if (!role) throw ApiError.notFound('Role not found');
  return role;
};

export const create = async (data) => {
  const existing = await roleRepository.findByCode(data.code);
  if (existing) throw ApiError.conflict('Role code already exists');
  return roleRepository.create(data);
};

export const update = async (uuid, data) => {
  const role = await roleRepository.findByUuid(uuid);
  if (!role) throw ApiError.notFound('Role not found');
  if (data.code && data.code !== role.code) {
    const existing = await roleRepository.findByCode(data.code);
    if (existing) throw ApiError.conflict('Role code already exists');
  }
  return role.update(data);
};

export const deleteRecord = async (uuid) => {
  const deleted = await roleRepository.deleteRecord(uuid);
  if (!deleted) throw ApiError.notFound('Role not found');
  return { message: 'Role deleted successfully' };
};
