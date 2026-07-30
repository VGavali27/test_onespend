import { Router } from 'express';
import * as authController from './auth.controller.js';
import validate from '../../middleware/validate.js';
import { loginSchema } from './auth.validation.js';

const router = Router();

// Login — returns JWT token
router.post('/login', validate(loginSchema), authController.login);

export default router;
