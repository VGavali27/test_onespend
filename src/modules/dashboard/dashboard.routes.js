import { Router } from 'express';
import * as dashboardController from './dashboard.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { dashboardQuerySchema } from './dashboard.validation.js';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/dashboard?period=this_month|last_month|this_quarter|this_year
router.get('/', validate(dashboardQuerySchema), requirePermission('dashboard:view'), dashboardController.getDashboard);

export default router;