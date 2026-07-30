import * as expenseService from './expense.service.js';
import ApiResponse from '../../utils/apiResponse.js';
// Fetch all expenses — add ?decrypt=true to decrypt amounts
export const getAllExpenses = async (req, res, next) => {
  try {
    const decrypt = req.query.decrypt === 'true';
    const expenses = await expenseService.getAll(decrypt);
    return ApiResponse.success(res, expenses, 'Expenses fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single expense by UUID — add ?decrypt=true to decrypt amounts
export const getExpenseByUuid = async (req, res, next) => {
  try {
    const decrypt = req.query.decrypt === 'true';
    const expense = await expenseService.getByUuid(req.params.uuid, decrypt);
    return ApiResponse.success(res, expense, 'Expense fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new expense
export const createExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.create(req.body);
    return ApiResponse.created(res, expense, 'Expense created successfully');
  } catch (error) {
    next(error);
  }
};

// Update an existing expense by UUID
export const updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, expense, 'Expense updated successfully');
  } catch (error) {
    next(error);
  }
};

// Soft delete an expense by UUID
export const deleteExpense = async (req, res, next) => {
  try {
    const result = await expenseService.delete(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
