import * as permissionRepository from './permission.repository.js';
import ApiError from '../../utils/ApiError.js';

export const getAll = async () => permissionRepository.findAll();

export const getByUuid = async (uuid) => {
  const permission = await permissionRepository.findByUuid(uuid);
  if (!permission) throw ApiError.notFound('Permission not found');
  return permission;
};

export const create = async (data) => {
  if (data.permission_key) {
    const existing = await permissionRepository.findByKey(data.permission_key);
    if (existing) throw ApiError.conflict('Permission key already exists');
  }
  return permissionRepository.create(data);
};

export const update = async (uuid, data) => {
  const permission = await permissionRepository.findByUuid(uuid);
  if (!permission) throw ApiError.notFound('Permission not found');
  if (data.permission_key && data.permission_key !== permission.permission_key) {
    const existing = await permissionRepository.findByKey(data.permission_key);
    if (existing) throw ApiError.conflict('Permission key already exists');
  }
  return permission.update(data);
};

export const deleteRecord = async (uuid) => {
  const deleted = await permissionRepository.deleteRecord(uuid);
  if (!deleted) throw ApiError.notFound('Permission not found');
  return { message: 'Permission deleted successfully' };
};
