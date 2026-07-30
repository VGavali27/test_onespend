import { Router } from 'express';
import * as userController from './user.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { createUserSchema, updateUserSchema } from './user.validation.js';

const router = Router();
router.use(authMiddleware);
// List all users
router.get('/', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), userController.getAllUsers);
// Get a single user by UUID
router.get('/:uuid', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), userController.getUserByUuid);
// Create a new user (validate body first)
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), validate(createUserSchema), userController.createUser);
// Update an existing user by UUID (validate body first)
router.put('/:uuid', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), validate(updateUserSchema), userController.updateUser);
// Soft delete a user by UUID
router.delete('/:uuid', requireRole('SUPER_ADMIN'), userController.deleteUser);
export default router;
