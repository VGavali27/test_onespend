import db from '../../database/models/index.js';

const { Role, ExpenseCategory } = db;

// Include the receiver/approver role names on every read
const roleIncludes = [
  { model: Role, as: 'firstReceiverRole' },
  { model: Role, as: 'finalApproverRole' },
];

// Fetch all categories ordered by name
export const findAll = async () => ExpenseCategory.findAll({ include: roleIncludes, order: [['name', 'ASC']] });

// Find a category by its UUID
export const findByUuid = async (uuid) =>
  ExpenseCategory.findOne({ where: { uuid }, include: roleIncludes });

// Find a category by its code
export const findByCode = async (code) => ExpenseCategory.findOne({ where: { code } });

// Lightweight dropdown options — uuid, name, module (module drives travel vs reimbursement forms)
export const findOptions = async () =>
  ExpenseCategory.findAll({
    attributes: ['uuid', 'name', 'module'],
    where: { status: 'ACTIVE' },
    order: [['name', 'ASC']],
  });

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
