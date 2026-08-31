import { Router } from 'express';
import * as travelExpenseController from './travel_expense.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { createExpenseWithTravelSchema, updateTravelExpenseSchema } from './travel_expense.validation.js';
const router = Router();
router.use(authMiddleware);
// Get travel expense by associated expense UUID
router.get('/by-expense/:expenseUuid', requirePermission('travel_expenses:read'), travelExpenseController.getTravelByExpense);
// Combined create — expense + travel + all child items in one call
router.post('/with-travel', requirePermission('travel_expenses:create'), validate(createExpenseWithTravelSchema), travelExpenseController.createWithTravel);
// Update travel expense by UUID
router.put('/:uuid', requirePermission('travel_expenses:update'), validate(updateTravelExpenseSchema), travelExpenseController.updateTravelExpense);
export default router;
