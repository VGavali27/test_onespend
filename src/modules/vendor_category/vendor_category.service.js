import * as vendorCategoryRepository from './vendor_category.repository.js';
import ApiError from '../../utils/ApiError.js';

export const getAll = async () => vendorCategoryRepository.findAll();
export const getOptions = async () => vendorCategoryRepository.findOptions();

export const getByUuid = async (uuid) => {
  const category = await vendorCategoryRepository.findByUuid(uuid);
  if (!category) throw ApiError.notFound('Vendor category not found');
  return category;
};

export const create = async (data) => {
  if (data.code) {
    const existing = await vendorCategoryRepository.findByCode(data.code);
    if (existing) throw ApiError.conflict('Vendor category code already exists');
  }
  return vendorCategoryRepository.create(data);
};

export const update = async (uuid, data) => {
  const category = await vendorCategoryRepository.findByUuid(uuid);
  if (!category) throw ApiError.notFound('Vendor category not found');
  if (data.code && data.code !== category.code) {
    const existing = await vendorCategoryRepository.findByCode(data.code);
    if (existing) throw ApiError.conflict('Vendor category code already exists');
  }
  return category.update(data);
};

export const deleteRecord = async (uuid) => {
  const deleted = await vendorCategoryRepository.deleteRecord(uuid);
  if (!deleted) throw ApiError.notFound('Vendor category not found');
  return { message: 'Vendor category deleted successfully' };
};
