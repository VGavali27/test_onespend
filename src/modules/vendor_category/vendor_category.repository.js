import db from '../../database/models/index.js';
const { VendorCategory } = db;

export const findAll = async () =>
  VendorCategory.findAll({ order: [['name', 'ASC']] });

export const findOptions = async () =>
  VendorCategory.findAll({ attributes: ['uuid', 'name'], order: [['name', 'ASC']] });

export const findByUuid = async (uuid) => VendorCategory.findOne({ where: { uuid } });

export const findByCode = async (code) => VendorCategory.findOne({ where: { code } });

export const create = async (data) => VendorCategory.create(data);

export const update = async (uuid, data) => {
  const category = await VendorCategory.findOne({ where: { uuid } });
  if (!category) return null;
  return category.update(data);
};

export const deleteRecord = async (uuid) => {
  const category = await VendorCategory.findOne({ where: { uuid } });
  if (!category) return false;
  await category.destroy();
  return true;
};
