import { Router } from 'express';
import * as travelMiscExpenseController from './travel_misc_expense.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createMiscExpenseSchema, updateMiscExpenseSchema } from './travel_misc_expense.validation.js';

const router = Router();
router.use(authMiddleware);


// List all misc expenses
router.get('/', travelMiscExpenseController.getAll);

// Get a single misc expense by UUID
router.get('/:uuid', travelMiscExpenseController.getByUuid);

// Create a new misc expense (validate body first)
router.post('/', validate(createMiscExpenseSchema), travelMiscExpenseController.create);

// Update an existing misc expense by UUID (validate body first)
router.put('/:uuid', validate(updateMiscExpenseSchema), travelMiscExpenseController.update);

// Soft delete a misc expense by UUID
router.delete('/:uuid', travelMiscExpenseController.deleteRecord);

export default router;
