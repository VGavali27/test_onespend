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

// Expenses assigned to the logged-in user's role (pending their approval) —
// paginated and company-scoped (SUPER_ADMIN/CFO see all). Query: page, limit, search, category, sortBy, sortOrder, decrypt
export const getAssignedExpenses = async (req, res, next) => {
  try {
    const { rows, total } = await expenseService.getAssigned(req.user, req.query);
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
    const toRoleId = req.body?.to_role_id ? Number(req.body.to_role_id) : null;
    const expense = await expenseService.approve(req.params.uuid, req.user, req.body?.remarks, toRoleId);
    return ApiResponse.success(res, expense, 'Expense approved successfully');
  } catch (error) {
    next(error);
  }
};

// Get valid handover target roles for the current handler of an expense
export const getHandoverRoles = async (req, res, next) => {
  try {
    const roles = await expenseService.getValidHandoverRoles(req.params.uuid);
    return ApiResponse.success(res, roles, 'Valid handover roles fetched');
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

// ── Payment endpoints (require expenses:pay permission) ──

export const recordPayment = async (req, res, next) => {
  try {
    const payment = await expenseService.recordPayment(req.params.uuid, req.user, req.body);
    return ApiResponse.created(res, payment, 'Payment recorded successfully');
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const payments = await expenseService.getPayments(req.params.uuid, req.user);
    return ApiResponse.success(res, payments, 'Payments fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getPaymentSummary = async (req, res, next) => {
  try {
    const summary = await expenseService.getPaymentSummary(req.params.uuid, req.user);
    return ApiResponse.success(res, summary, 'Payment summary fetched successfully');
  } catch (error) {
    next(error);
  }
};

// ── Payment handover endpoints ──

export const handoverForPayment = async (req, res, next) => {
  try {
    const toRoleId = req.body?.to_role_id ? Number(req.body.to_role_id) : null;
    const expense = await expenseService.handoverForPayment(req.params.uuid, req.user, toRoleId, req.body?.remarks);
    return ApiResponse.success(res, expense, 'Payment handover successful');
  } catch (error) {
    next(error);
  }
};

export const getPaymentHandoverRoles = async (req, res, next) => {
  try {
    const roles = await expenseService.getPaymentHandoverRoles(req.params.uuid);
    return ApiResponse.success(res, roles, 'Payment handover roles fetched');
  } catch (error) {
    next(error);
  }
};

export const getMyPaymentRequests = async (req, res, next) => {
  try {
    const { rows, total } = await expenseService.getMyPaymentRequests(req.user, req.query);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    return ApiResponse.paginated(res, rows, { page, limit, total });
  } catch (error) {
    next(error);
  }
};
