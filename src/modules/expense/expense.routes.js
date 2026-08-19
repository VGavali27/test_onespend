import { Router } from 'express';
import * as expenseController from './expense.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { EXPENSE_MANAGER_ROLES } from './expense.service.js';
import { createExpenseSchema, updateExpenseSchema, actionSchema } from './expense.validation.js';
const router = Router();
router.use(authMiddleware);
// Scoped "all expenses" list (role + company scoping in the service) — manager roles only
router.get('/', requireRole(...EXPENSE_MANAGER_ROLES), expenseController.getAllExpenses);
// Expenses assigned to the logged-in user's role (pending approval) — any authenticated user with expense-manager role
router.get('/assigned', requireRole(...EXPENSE_MANAGER_ROLES), expenseController.getAssignedExpenses);
// Expenses created by the logged-in user — any authenticated user
router.get('/my', expenseController.getMyExpenses);
// Get valid handover target roles for an expense (for the current handler)
router.get('/:uuid/handover-roles', expenseController.getHandoverRoles);
// Lazy-load the source procurement chain for a procurement-linked expense
router.get('/:uuid/procurement-chain', expenseController.getExpenseProcurementChain);
// Get a single expense by UUID (visibility-checked)
router.get('/:uuid', expenseController.getExpenseByUuid);
// Create a new expense (validate body first)
router.post('/', validate(createExpenseSchema), expenseController.createExpense);
// Update an existing expense by UUID (validate body first)
router.put('/:uuid', validate(updateExpenseSchema), expenseController.updateExpense);
// Soft delete an expense by UUID
router.delete('/:uuid', expenseController.deleteExpense);
// ── Approval workflow (PO-created expenses follow the expense role-handover chain) ──
router.post('/:uuid/submit', validate(actionSchema), expenseController.submitExpense);
router.post('/:uuid/approve', validate(actionSchema), expenseController.approveExpense);
router.post('/:uuid/reject', validate(actionSchema), expenseController.rejectExpense);
export default router;
