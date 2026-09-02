import { Router } from 'express';
import * as expenseController from './expense.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { createExpenseSchema, updateExpenseSchema, actionSchema, recordPaymentSchema } from './expense.validation.js';
const router = Router();
router.use(authMiddleware);
// Scoped "all expenses" list (role + company scoping in the service)
router.get('/', requirePermission('expenses:read_all'), expenseController.getAllExpenses);
// Expenses assigned to the logged-in user's role (pending approval)
router.get('/assigned', requirePermission('expenses:approvals'), expenseController.getAssignedExpenses);
// Expenses created by the logged-in user — any authenticated user
router.get('/my', expenseController.getMyExpenses);
// Expenses pending payment at the logged-in user's role (must precede /:uuid)
router.get('/my-payments', requirePermission('expenses:read'), expenseController.getMyPaymentRequests);
// Get valid handover target roles for an expense (for the current handler)
router.get('/:uuid/handover-roles', expenseController.getHandoverRoles);
// Lazy-load the source procurement chain for a procurement-linked expense
router.get('/:uuid/procurement-chain', expenseController.getExpenseProcurementChain);
// Get a single expense by UUID (visibility-checked)
router.get('/:uuid', requirePermission('expenses:read'), expenseController.getExpenseByUuid);
// Create a new expense (validate body first)
router.post('/', requirePermission('expenses:create'), validate(createExpenseSchema), expenseController.createExpense);
// Update an existing expense by UUID (validate body first)
router.put('/:uuid', requirePermission('expenses:update'), validate(updateExpenseSchema), expenseController.updateExpense);
// Soft delete an expense by UUID
router.delete('/:uuid', requirePermission('expenses:delete'), expenseController.deleteExpense);
// ── Approval workflow (PO-created expenses follow the expense role-handover chain) ──
router.post('/:uuid/submit', requirePermission('expenses:submit'), validate(actionSchema), expenseController.submitExpense);
router.post('/:uuid/approve', requirePermission('expenses:approve'), validate(actionSchema), expenseController.approveExpense);
router.post('/:uuid/reject', requirePermission('expenses:reject'), validate(actionSchema), expenseController.rejectExpense);

// ── Payment endpoints (require expenses:pay permission) ──
router.post('/:uuid/payments', requirePermission('expenses:pay'), validate(recordPaymentSchema), expenseController.recordPayment);
router.get('/:uuid/payments', requirePermission('expenses:read'), expenseController.getPayments);
router.get('/:uuid/payment-summary', requirePermission('expenses:read'), expenseController.getPaymentSummary);

// ── Payment handover (requester forwards to a payment-eligible role) ──
router.post('/:uuid/handover-payment', requirePermission('expenses:pay'), validate(actionSchema), expenseController.handoverForPayment);
router.get('/:uuid/payment-handover-roles', requirePermission('expenses:pay'), expenseController.getPaymentHandoverRoles);

export default router;
