import { Router } from 'express';
import * as userController from './user.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { createUserSchema, updateUserSchema } from './user.validation.js';

const router = Router();
router.use(authMiddleware);
// List all users
router.get('/', requirePermission('users:read_all'), userController.getAllUsers);
// Get the authenticated user's profile (must precede /:uuid)
router.get('/me', userController.getMyProfile);
// Get the authenticated user's permissions (with all permissions grouped by resource)
router.get('/me/permissions', userController.getMyPermissions);
// Get a single user by UUID
router.get('/:uuid', requirePermission('users:read'), userController.getUserByUuid);
// Create a new user (validate body first)
router.post('/', requirePermission('users:create'), validate(createUserSchema), userController.createUser);
// Update an existing user by UUID (validate body first)
router.put('/:uuid', requirePermission('users:update'), validate(updateUserSchema), userController.updateUser);
// Soft delete a user by UUID
router.delete('/:uuid', requirePermission('users:delete'), userController.deleteUser);
export default router;
