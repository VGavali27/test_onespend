import * as expenseRepository from './expense.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { ExpenseCategory, Company, User, UserEmployment, sequelize } = db;

const generateExpenseNumber = async () => {
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
};

export const getAll = async () => expenseRepository.findAll();

export const getByUuid = async (uuid) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');
  return expense;
};

export const create = async (data) => {
  const category = await ExpenseCategory.findOne({ where: { uuid: data.category_uuid } });
  if (!category) throw ApiError.notFound('Referenced expense category not found');
  const company = await Company.findOne({ where: { uuid: data.company_uuid } });
  if (!company) throw ApiError.notFound('Referenced company not found');
  const user = await User.findOne({ where: { uuid: data.requested_by_user_uuid } });
  if (!user) throw ApiError.notFound('Referenced user not found');
  const employment = await UserEmployment.findOne({ where: { user_id: user.id, status: 'ACTIVE' } });
  if (!employment) throw ApiError.notFound('No active employment found for the user');

  const expenseNumber = await generateExpenseNumber();
  const travelFields = {};
  const travelChildFields = {};
  if (category.module === 'travel') {
    travelFields.travel_type = data.travel_type;
    travelFields.purpose = data.purpose;
    travelFields.travel_start_date = data.travel_start_date;
    travelFields.travel_end_date = data.travel_end_date;
    travelFields.total_travellers = data.total_travellers || 1;
    travelFields.notes = data.notes || null;
    travelChildFields.segments = data.segments || [];
    travelChildFields.accommodations = data.accommodations || [];
    travelChildFields.local_transports = data.local_transports || [];
    travelChildFields.forex = data.forex || [];
    travelChildFields.misc_expenses = data.misc_expenses || [];
  }

  const { category_uuid, company_uuid, requested_by_user_uuid,
    travel_type, purpose, travel_start_date, travel_end_date, total_travellers, notes,
    segments, accommodations, local_transports, forex, misc_expenses,
    ...expenseData } = data;

  return sequelize.transaction(async (t) => {
    const expense = await db.Expense.create({
      ...expenseData, expense_number: expenseNumber,
      category_id: category.id, company_id: company.id,
      requested_by_employment_id: employment.id, status: 'DRAFT',
    }, { transaction: t });

    if (category.module === 'travel' && travelFields.travel_type) {
      const travelExpense = await db.TravelExpense.create({
        expense_id: expense.id, ...travelFields,
      }, { transaction: t });

      if (travelChildFields.segments.length > 0) {
        await db.TravelExpenseSegment.bulkCreate(
          travelChildFields.segments.map((s) => ({ ...s, travel_expense_id: travelExpense.id })), { transaction: t });
      }
      if (travelChildFields.accommodations.length > 0) {
        await db.TravelExpenseAccommodation.bulkCreate(
          travelChildFields.accommodations.map((a) => ({ ...a, travel_expense_id: travelExpense.id })), { transaction: t });
      }
      if (travelChildFields.local_transports.length > 0) {
        await db.TravelExpenseLocalTransport.bulkCreate(
          travelChildFields.local_transports.map((lt) => ({ ...lt, travel_expense_id: travelExpense.id })), { transaction: t });
      }
      if (travelChildFields.forex.length > 0) {
        await db.TravelExpenseForex.bulkCreate(
          travelChildFields.forex.map((f) => ({ ...f, travel_expense_id: travelExpense.id })), { transaction: t });
      }
      if (travelChildFields.misc_expenses.length > 0) {
        await db.TravelExpenseMiscExpense.bulkCreate(
          travelChildFields.misc_expenses.map((m) => ({ ...m, travel_expense_id: travelExpense.id })), { transaction: t });
      }
    }
    return expense;
  });
};

export const update = async (uuid, data) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');
  if (expense.status !== 'DRAFT') throw ApiError.badRequest('Cannot update a non-draft expense');
  if (data.category_uuid) {
    const category = await ExpenseCategory.findOne({ where: { uuid: data.category_uuid } });
    if (!category) throw ApiError.notFound('Referenced expense category not found');
    data.category_id = category.id; delete data.category_uuid;
  }
  if (data.company_uuid) {
    const company = await Company.findOne({ where: { uuid: data.company_uuid } });
    if (!company) throw ApiError.notFound('Referenced company not found');
    data.company_id = company.id; delete data.company_uuid;
  }
  return expense.update(data);
};

export const deleteRecord = async (uuid) => {
  const deleted = await expenseRepository.deleteRecord(uuid);
  if (!deleted) throw ApiError.notFound('Expense not found');
  return { message: 'Expense deleted successfully' };
};
