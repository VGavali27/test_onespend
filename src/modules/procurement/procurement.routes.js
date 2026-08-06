import { Router } from 'express';
import * as procurementController from './procurement.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import {
  createProcurementSchema,
  updateProcurementSchema,
  actionSchema,
  procurementDocumentSchema,
} from './procurement.validation.js';

const router = Router();
router.use(authMiddleware);

// List procurement documents (role-scoped) / detail
router.get('/', procurementController.getAllProcurements);
router.get('/:uuid', procurementController.getProcurementByUuid);

// Create / edit / delete a PI (drafts)
router.post('/', validate(createProcurementSchema), procurementController.createProcurement);
router.put('/:uuid', validate(updateProcurementSchema), procurementController.updateProcurement);

// Attach / remove a document (must precede DELETE /:uuid so '/documents/:uuid' wins)
router.post('/:uuid/documents', validate(procurementDocumentSchema), procurementController.addDocument);
router.delete('/documents/:uuid', procurementController.deleteDocument);
router.delete('/:uuid', procurementController.deleteProcurement);

// Workflow actions
router.post('/:uuid/submit', validate(actionSchema), procurementController.submitProcurement);
router.post('/:uuid/approve', validate(actionSchema), procurementController.approveProcurement);
router.post('/:uuid/reject', validate(actionSchema), procurementController.rejectProcurement);
router.post('/:uuid/create-pr', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), procurementController.createPr);
router.post('/:uuid/create-po', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), procurementController.createPo);
router.post('/:uuid/received', requireRole('SUPER_ADMIN', 'ADMIN_MGR', 'FINANCE_MGR'), procurementController.markReceived);
router.post('/:uuid/pay', requireRole('SUPER_ADMIN', 'CFO', 'PAYMENT_MGR'), procurementController.markPaid);

export default router;
