import { Router } from 'express';
import * as reimbursementController from './reimbursement.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { updateReimbursementSchema } from './reimbursement.validation.js';

const router = Router();
router.use(authMiddleware);
// Get reimbursement by the associated expense UUID
router.get('/by-expense/:expenseUuid', requirePermission('reimbursements:read'), reimbursementController.getReimbursementByExpense);
// Update a reimbursement (header + items) by its own UUID
router.put('/:uuid', requirePermission('reimbursements:update'), validate(updateReimbursementSchema), reimbursementController.updateReimbursement);

export default router;
