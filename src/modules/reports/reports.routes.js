import { Router } from 'express';
import * as reportsController from './reports.controller.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Read-only CA/finance reports — all gated by the payments:reports permission.
router.get('/payments/summary', requirePermission('payments:reports'), reportsController.getPaymentSummary);
router.get('/payments/export', requirePermission('payments:reports'), reportsController.exportPayments);
router.get('/payments', requirePermission('payments:reports'), reportsController.getPaymentReport);

export default router;