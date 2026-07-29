import db from '../../database/models/index.js';
const { ExpenseCategory } = db;

export const findAll = async () => ExpenseCategory.findAll({ order: [['name', 'ASC']] });
export const findByUuid = async (uuid) => ExpenseCategory.findOne({ where: { uuid } });
export const findByCode = async (code) => ExpenseCategory.findOne({ where: { code } });
export const create = async (data) => ExpenseCategory.create(data);
export const update = async (uuid, data) => {
  const category = await ExpenseCategory.findOne({ where: { uuid } });
  if (!category) return null;
  return category.update(data);
};
export const deleteRecord = async (uuid) => {
  const category = await ExpenseCategory.findOne({ where: { uuid } });
  if (!category) return false;
  await category.destroy();
  return true;
};
