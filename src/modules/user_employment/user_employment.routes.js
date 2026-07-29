import { Router } from 'express';
import * as userEmploymentController from './user_employment.controller.js';
import validate from '../../middleware/validate.js';
import { createUserEmploymentSchema, updateUserEmploymentSchema } from './user_employment.validation.js';
const router = Router();
// List all employments
router.get('/', userEmploymentController.getAllEmployments);
// List employments for a specific user by user UUID
router.get('/by-user/:userUuid', userEmploymentController.getEmploymentsByUser);
// Get a single employment by UUID
router.get('/:uuid', userEmploymentController.getEmploymentByUuid);
// Create a new employment (validate body first)
router.post('/', validate(createUserEmploymentSchema), userEmploymentController.createEmployment);
// Update an existing employment by UUID (validate body first)
router.put('/:uuid', validate(updateUserEmploymentSchema), userEmploymentController.updateEmployment);
// Soft delete an employment by UUID
router.delete('/:uuid', userEmploymentController.deleteEmployment);
export default router;
