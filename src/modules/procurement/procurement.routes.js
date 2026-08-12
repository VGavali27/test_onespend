import { Router } from 'express';
import * as procurementController from './procurement.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requireRole, requirePermission } from '../../middleware/auth.js';
import {
  createProcurementSchema,
  updateProcurementSchema,
  updateProcurementItemsSchema,
  actionSchema,
  procurementDocumentSchema,
  quotationSchema,
  updateQuotationSchema,
  selectQuotationSchema,
} from './procurement.validation.js';

const router = Router();
router.use(authMiddleware);

// List procurement documents (role-scoped) / detail
router.get('/', procurementController.getAllProcurements);
router.get('/:uuid', procurementController.getProcurementByUuid);

// Create / edit / delete a PI (drafts). Anyone whose role has the procurement:create
// permission may raise a PI (per role_permissions, not handover rules).
router.post('/', requirePermission('procurement:create'), validate(createProcurementSchema), procurementController.createProcurement);
router.put('/:uuid', validate(updateProcurementSchema), procurementController.updateProcurement);

// Admin edits a PR's line items (qty / unit price) while quotations are gathered
router.put('/:uuid/items', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), validate(updateProcurementItemsSchema), procurementController.updateProcurementItems);

// Attach / remove a document (must precede DELETE /:uuid so '/documents/:uuid' wins)
router.post('/:uuid/documents', validate(procurementDocumentSchema), procurementController.addDocument);
router.delete('/documents/:uuid', procurementController.deleteDocument);
router.delete('/:uuid', procurementController.deleteProcurement);

// Quotations — admin fills them on a PR; requester picks one blind.
// (These must precede the generic /:uuid routes above.)
router.post('/:uuid/quotations', validate(quotationSchema), procurementController.addQuotation);
router.put('/:uuid/quotations/:quotationUuid', validate(updateQuotationSchema), procurementController.updateQuotation);
router.delete('/:uuid/quotations/:quotationUuid', procurementController.deleteQuotation);
router.post('/:uuid/submit-quotations', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), procurementController.submitQuotations);
router.post('/:uuid/select-quotation', validate(selectQuotationSchema), procurementController.selectQuotation);

// Workflow actions
router.post('/:uuid/submit', requirePermission('procurement:create'), validate(actionSchema), procurementController.submitProcurement);
router.post('/:uuid/approve', validate(actionSchema), procurementController.approveProcurement);
router.post('/:uuid/reject', validate(actionSchema), procurementController.rejectProcurement);
router.post('/:uuid/create-pr', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), procurementController.createPr);
router.post('/:uuid/create-po', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), procurementController.createPo);
router.post('/:uuid/convert-to-expense', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), procurementController.convertToExpense);
router.post('/:uuid/received', requireRole('SUPER_ADMIN', 'ADMIN_MGR', 'FINANCE_MGR'), procurementController.markReceived);
router.post('/:uuid/pay', requireRole('SUPER_ADMIN', 'CFO', 'PAYMENT_MGR'), procurementController.markPaid);

export default router;
