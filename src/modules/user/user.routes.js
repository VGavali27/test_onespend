import { Router } from 'express';
import * as userController from './user.controller.js';
import validate from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema } from './user.validation.js';

const router = Router();

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', validate(createUserSchema), userController.createUser);
router.put('/:id', validate(updateUserSchema), userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
