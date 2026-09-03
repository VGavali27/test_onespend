import { Router } from 'express';
import * as systemLogsController from './system_logs.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { logsQuerySchema } from './system_logs.validation.js';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/system/logs/meta — available log dates (newest first)
router.get('/meta', requirePermission('system_logs:view'), systemLogsController.getLogDates);

// GET /api/v1/system/logs/error?date=YYYY-MM-DD — a given day's error.log (error + warn, with stacks)
router.get('/error', validate(logsQuerySchema), requirePermission('system_logs:view'), systemLogsController.getErrorLogs);

// GET /api/v1/system/logs/api?date=YYYY-MM-DD — a given day's api.log (request traffic)
router.get('/api', validate(logsQuerySchema), requirePermission('system_logs:view'), systemLogsController.getApiLogs);

// GET /api/v1/system/logs?date=YYYY-MM-DD — a given day's error.log + api.log combined
router.get('/', validate(logsQuerySchema), requirePermission('system_logs:view'), systemLogsController.getLogs);

export default router;