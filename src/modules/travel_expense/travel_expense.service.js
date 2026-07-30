import * as travelExpenseRepository from './travel_expense.repository.js';
import * as expenseRepository from '../expense/expense.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { ExpenseCategory, Company, User, UserEmployment, sequelize } = db;

// Get travel expense by associated expense UUID
export const getByExpenseUuid = async (expenseUuid) => {
  const te = await travelExpenseRepository.findByExpenseUuid(expenseUuid);
  if (!te) throw ApiError.notFound('Travel expense not found');
  return te;
};

// Create expense with travel and all child items in one transaction
export const createWithTravel = async (data) => {
  const category = await ExpenseCategory.findOne({ where: { uuid: data.category_uuid } });
  if (!category) throw ApiError.notFound('Referenced expense category not found');
  const company = await Company.findOne({ where: { uuid: data.company_uuid } });
  if (!company) throw ApiError.notFound('Referenced company not found');
  const user = await User.findOne({ where: { uuid: data.requested_by_user_uuid } });
  if (!user) throw ApiError.notFound('Referenced user not found');
  const employment = await UserEmployment.findOne({ where: { user_id: user.id, status: 'ACTIVE' } });
  if (!employment) throw ApiError.notFound('No active employment found for the user');

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const pattern = `EXP-${dateStr}-%`;
  const last = await expenseRepository.findLatestExpenseNumber(pattern);
  let seq = 1;
  if (last) {
    const parts = last.expense_number.split('-');
    seq = parseInt(parts[3], 10) + 1;
  }
  const expenseNumber = `EXP-${dateStr}-${String(seq).padStart(4, '0')}`;

  return sequelize.transaction(async (t) => {
    const expense = await db.Expense.create({
      expense_number: expenseNumber, title: data.title, remarks: data.remarks || null,
      category_id: category.id, company_id: company.id,
      requested_by_employment_id: employment.id,
      estimated_amount: data.estimated_amount, status: 'DRAFT',
    }, { transaction: t });

    const travelExpense = await db.TravelExpense.create({
      expense_id: expense.id, travel_type: data.travel_type, purpose: data.purpose,
      travel_start_date: data.travel_start_date, travel_end_date: data.travel_end_date,
      total_travellers: data.total_travellers || 1, notes: data.notes || null,
    }, { transaction: t });

    if (data.segments?.length) {
      await db.TravelExpenseSegment.bulkCreate(
        data.segments.map((s) => ({ ...s, travel_expense_id: travelExpense.id })), { transaction: t });
    }
    if (data.accommodations?.length) {
      await db.TravelExpenseAccommodation.bulkCreate(
        data.accommodations.map((a) => ({ ...a, travel_expense_id: travelExpense.id })), { transaction: t });
    }
    if (data.local_transports?.length) {
      await db.TravelExpenseLocalTransport.bulkCreate(
        data.local_transports.map((lt) => ({ ...lt, travel_expense_id: travelExpense.id })), { transaction: t });
    }
    if (data.forex?.length) {
      await db.TravelExpenseForex.bulkCreate(
        data.forex.map((f) => ({ ...f, travel_expense_id: travelExpense.id })), { transaction: t });
    }
    if (data.misc_expenses?.length) {
      await db.TravelExpenseMiscExpense.bulkCreate(
        data.misc_expenses.map((m) => ({ ...m, travel_expense_id: travelExpense.id })), { transaction: t });
    }
    return expense;
  });
};

// Update travel expense by UUID
export const update = async (uuid, data) => {
  const updated = await travelExpenseRepository.update(uuid, data);
  if (!updated) throw ApiError.notFound('Travel expense not found');
  return updated;
};
