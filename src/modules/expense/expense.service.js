import expenseRepository from './expense.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';

const { ExpenseCategory, Company, User, UserEmployment, sequelize } = db;

class ExpenseService {
  // Generate expense number: EXP-YYYYMMDD-XXXX
  async generateExpenseNumber() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const pattern = `EXP-${dateStr}-%`;

    const last = await expenseRepository.findLatestExpenseNumber(pattern);
    let seq = 1;
    if (last) {
      const parts = last.expense_number.split('-');
      seq = parseInt(parts[3], 10) + 1;
    }
    return `EXP-${dateStr}-${String(seq).padStart(4, '0')}`;
  }

  // Fetch all expenses
  async getAll() {
    return expenseRepository.findAll();
  }

  // Fetch a single expense by UUID — throws 404 if missing
  async getByUuid(uuid) {
    const expense = await expenseRepository.findByUuid(uuid);
    if (!expense) {
      throw ApiError.notFound('Expense not found');
    }
    return expense;
  }

  // Create a new expense — resolves UUIDs, generates expense number
  async create(data) {
    const category = await ExpenseCategory.findOne({ where: { uuid: data.category_uuid } });
    if (!category) throw ApiError.notFound('Referenced expense category not found');

    const company = await Company.findOne({ where: { uuid: data.company_uuid } });
    if (!company) throw ApiError.notFound('Referenced company not found');

    // Resolve user to their primary employment
    const user = await User.findOne({ where: { uuid: data.requested_by_user_uuid } });
    if (!user) throw ApiError.notFound('Referenced user not found');

    const employment = await UserEmployment.findOne({ where: { user_id: user.id, status: 'ACTIVE' } });
    if (!employment) throw ApiError.notFound('No active employment found for the user');

    const expenseNumber = await this.generateExpenseNumber();
    const { category_uuid, company_uuid, requested_by_user_uuid, ...cleanData } = data;

    return expenseRepository.create({
      ...cleanData,
      expense_number: expenseNumber,
      category_id: category.id,
      company_id: company.id,
      requested_by_employment_id: employment.id,
      status: 'DRAFT',
    });
  }

  // Update an expense by UUID
  async update(uuid, data) {
    const expense = await expenseRepository.findByUuid(uuid);
    if (!expense) throw ApiError.notFound('Expense not found');

    if (expense.status !== 'DRAFT') {
      throw ApiError.badRequest('Cannot update a non-draft expense');
    }

    if (data.category_uuid) {
      const category = await ExpenseCategory.findOne({ where: { uuid: data.category_uuid } });
      if (!category) throw ApiError.notFound('Referenced expense category not found');
      data.category_id = category.id;
      delete data.category_uuid;
    }

    if (data.company_uuid) {
      const company = await Company.findOne({ where: { uuid: data.company_uuid } });
      if (!company) throw ApiError.notFound('Referenced company not found');
      data.company_id = company.id;
      delete data.company_uuid;
    }

    return expense.update(data);
  }

  // Soft delete an expense by UUID
  async delete(uuid) {
    const deleted = await expenseRepository.delete(uuid);
    if (!deleted) throw ApiError.notFound('Expense not found');
    return { message: 'Expense deleted successfully' };
  }
}

export default new ExpenseService();
