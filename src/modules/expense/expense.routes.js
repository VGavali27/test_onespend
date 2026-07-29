import { Router } from 'express';
import * as expenseController from './expense.controller.js';
import validate from '../../middleware/validate.js';
import { createExpenseSchema, updateExpenseSchema } from './expense.validation.js';
const router = Router();
// List all expenses
router.get('/', expenseController.getAllExpenses);
// Get a single expense by UUID
router.get('/:uuid', expenseController.getExpenseByUuid);
// Create a new expense (validate body first)
router.post('/', validate(createExpenseSchema), expenseController.createExpense);
// Update an existing expense by UUID (validate body first)
router.put('/:uuid', validate(updateExpenseSchema), expenseController.updateExpense);
// Soft delete an expense by UUID
router.delete('/:uuid', expenseController.deleteExpense);
export default router;
