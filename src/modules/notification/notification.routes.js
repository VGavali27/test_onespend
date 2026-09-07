import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { notificationQuerySchema } from './notification.validation.js';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/notifications/count — bell badge (pending assigned + payment requests)
router.get('/count', notificationController.getNotificationCount);

// GET /api/v1/notifications?limit=&type=&scope= — merged dropdown feed (assigned + activity)
router.get('/', notificationController.getNotifications);

export default router;
