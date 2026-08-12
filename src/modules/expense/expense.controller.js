import * as expenseService from './expense.service.js';
import ApiResponse from '../../utils/apiResponse.js';

// Scoped "all expenses" list (role + company scoping) — paginated.
// Query: page, limit, search, status, category, sortBy, sortOrder, decrypt
export const getAllExpenses = async (req, res, next) => {
  try {
    const { rows, total } = await expenseService.getVisible(req.user, req.query);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    return ApiResponse.paginated(res, rows, { page, limit, total });
  } catch (error) {
    next(error);
  }
};

// Expenses created by the logged-in user — paginated (same query params as above)
export const getMyExpenses = async (req, res, next) => {
  try {
    const { rows, total } = await expenseService.getMyExpenses(req.user.userId, req.query);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    return ApiResponse.paginated(res, rows, { page, limit, total });
  } catch (error) {
    next(error);
  }
};

// Fetch a single expense by UUID (visibility-checked) — add ?decrypt=true to decrypt amounts
export const getExpenseByUuid = async (req, res, next) => {
  try {
    const decrypt = req.query.decrypt === 'true';
    const expense = await expenseService.getByUuid(req.params.uuid, req.user, decrypt);
    return ApiResponse.success(res, expense, 'Expense fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Lazy-load the source procurement chain (PI → PR → quotations → PO + approval logs)
export const getExpenseProcurementChain = async (req, res, next) => {
  try {
    const data = await expenseService.getProcurementChain(req.params.uuid, req.user);
    return ApiResponse.success(res, data, 'Procurement history loaded');
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

// Update an existing expense by UUID (creator-only while DRAFT)
export const updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.update(req.params.uuid, req.user, req.body);
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

// ── Approval workflow (PO-created expenses follow the expense role-handover chain) ──

export const submitExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.submit(req.params.uuid, req.user, req.body?.remarks);
    return ApiResponse.success(res, expense, 'Expense submitted successfully');
  } catch (error) {
    next(error);
  }
};

export const approveExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.approve(req.params.uuid, req.user, req.body?.remarks);
    return ApiResponse.success(res, expense, 'Expense approved successfully');
  } catch (error) {
    next(error);
  }
};

export const rejectExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.reject(req.params.uuid, req.user, req.body?.remarks);
    return ApiResponse.success(res, expense, 'Expense rejected');
  } catch (error) {
    next(error);
  }
};
