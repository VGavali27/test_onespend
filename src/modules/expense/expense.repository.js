import db from '../../database/models/index.js';
import { DB_TABLES } from '../../constants/index.js';
const { Expense } = db;

class ExpenseRepository {
  // Fetch all expenses ordered by creation date (newest first)
  async findAll() {
    return Expense.findAll({ order: [['createdAt', 'DESC']] });
  }
  // Find an expense by its UUID
  async findByUuid(uuid) {
    return Expense.findOne({ where: { uuid } });
  }
  // Find the latest expense number for a given prefix/date
  async findLatestExpenseNumber(pattern) {
    return Expense.findOne({
      where: { expense_number: { [db.Sequelize.Op.like]: pattern } },
      order: [['expense_number', 'DESC']],
      paranoid: false,
    });
  }
  // Create a new expense record
  async create(data) {
    return Expense.create(data);
  }
  // Update an expense by UUID — returns null if not found
  async update(uuid, data) {
    const expense = await Expense.findOne({ where: { uuid } });
    if (!expense) return null;
    return expense.update(data);
  }
  // Soft delete an expense by UUID — returns false if not found
  async delete(uuid) {
    const expense = await Expense.findOne({ where: { uuid } });
    if (!expense) return false;
    await expense.destroy();
    return true;
  }
}

export default new ExpenseRepository();
