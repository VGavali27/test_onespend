import { Router } from 'express';
import * as userEmploymentController from './user_employment.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { createUserEmploymentSchema, updateUserEmploymentSchema } from './user_employment.validation.js';

const router = Router();
router.use(authMiddleware);
// List all employments
router.get('/', requirePermission('user_employments:read_all'), userEmploymentController.getAllEmployments);
// List employments for a specific user by user UUID
router.get('/by-user/:userUuid', requirePermission('user_employments:read'), userEmploymentController.getEmploymentsByUser);
// Get a single employment by UUID
router.get('/:uuid', requirePermission('user_employments:read'), userEmploymentController.getEmploymentByUuid);
// Create a new employment (validate body first)
router.post('/', requirePermission('user_employments:create'), validate(createUserEmploymentSchema), userEmploymentController.createEmployment);
// Update an existing employment by UUID (validate body first)
router.put('/:uuid', requirePermission('user_employments:update'), validate(updateUserEmploymentSchema), userEmploymentController.updateEmployment);
// Soft delete an employment by UUID
router.delete('/:uuid', requirePermission('user_employments:delete'), userEmploymentController.deleteEmployment);
export default router;
