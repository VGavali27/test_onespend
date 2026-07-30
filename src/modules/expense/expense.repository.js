import db from '../../database/models/index.js';
const { Expense } = db;

// Fetch all expenses ordered by creation date (newest first)
export const findAll = async () => Expense.findAll({ order: [['createdAt', 'DESC']] });

// Find an expense by its UUID
export const findByUuid = async (uuid) => Expense.findOne({ where: { uuid } });

// Find the latest expense number for a given prefix/date
export const findLatestExpenseNumber = async (pattern) => {
  return Expense.findOne({
    where: { expense_number: { [db.Sequelize.Op.like]: pattern } },
    order: [['expense_number', 'DESC']],
    paranoid: false,
  });
};

// Create a new expense record
export const create = async (data) => Expense.create(data);

// Update an expense by UUID — returns null if not found
export const update = async (uuid, data) => {
  const expense = await Expense.findOne({ where: { uuid } });
  if (!expense) return null;
  return expense.update(data);
};

// Soft delete an expense by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const expense = await Expense.findOne({ where: { uuid } });
  if (!expense) return false;
  await expense.destroy();
  return true;
};
