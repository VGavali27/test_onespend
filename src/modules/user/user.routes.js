import { Router } from 'express';
import * as userController from './user.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createUserSchema, updateUserSchema } from './user.validation.js';

const router = Router();
router.use(authMiddleware);
// List all users
router.get('/', userController.getAllUsers);
// Get a single user by UUID
router.get('/:uuid', userController.getUserByUuid);
// Create a new user (validate body first)
router.post('/', validate(createUserSchema), userController.createUser);
// Update an existing user by UUID (validate body first)
router.put('/:uuid', validate(updateUserSchema), userController.updateUser);
// Soft delete a user by UUID
router.delete('/:uuid', userController.deleteUser);
export default router;
