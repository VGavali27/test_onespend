import db from '../../database/models/index.js';
const { ExpenseCategory } = db;

// Fetch all categories ordered by name
export const findAll = async () => ExpenseCategory.findAll({ order: [['name', 'ASC']] });

// Find a category by its UUID
export const findByUuid = async (uuid) => ExpenseCategory.findOne({ where: { uuid } });

// Find a category by its code
export const findByCode = async (code) => ExpenseCategory.findOne({ where: { code } });

// Create a new category record
export const create = async (data) => ExpenseCategory.create(data);

// Update a category by UUID — returns null if not found
export const update = async (uuid, data) => {
  const category = await ExpenseCategory.findOne({ where: { uuid } });
  if (!category) return null;
  return category.update(data);
};

// Soft delete a category by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const category = await ExpenseCategory.findOne({ where: { uuid } });
  if (!category) return false;
  await category.destroy();
  return true;
};
