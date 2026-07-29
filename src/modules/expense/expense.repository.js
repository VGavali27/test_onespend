import db from '../../database/models/index.js';
const { Expense } = db;

export const findAll = async () => Expense.findAll({ order: [['createdAt', 'DESC']] });
export const findByUuid = async (uuid) => Expense.findOne({ where: { uuid } });

export const findLatestExpenseNumber = async (pattern) => {
  return Expense.findOne({
    where: { expense_number: { [db.Sequelize.Op.like]: pattern } },
    order: [['expense_number', 'DESC']],
    paranoid: false,
  });
};

export const create = async (data) => Expense.create(data);
export const update = async (uuid, data) => {
  const expense = await Expense.findOne({ where: { uuid } });
  if (!expense) return null;
  return expense.update(data);
};
export const deleteRecord = async (uuid) => {
  const expense = await Expense.findOne({ where: { uuid } });
  if (!expense) return false;
  await expense.destroy();
  return true;
};
