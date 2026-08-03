import { Router } from 'express';
import * as groupController from './group.controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Lightweight group options for dropdowns (must precede /:uuid)
router.get('/options', groupController.getGroupOptions);
// List all groups
router.get('/', groupController.getGroups);

export default router;