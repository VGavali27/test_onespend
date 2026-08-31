import { Router } from 'express';
import * as procurementController from './procurement.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
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
router.get('/', requirePermission('procurement:read_all'), procurementController.getAllProcurements);
router.get('/:uuid', requirePermission('procurement:read'), procurementController.getProcurementByUuid);

// Create / edit / delete a PI (drafts). Anyone whose role has the procurement:create
// permission may raise a PI (per role_permissions, not handover rules).
router.post('/', requirePermission('procurement:create'), validate(createProcurementSchema), procurementController.createProcurement);
router.put('/:uuid', requirePermission('procurement:update'), validate(updateProcurementSchema), procurementController.updateProcurement);

// Admin edits a PR's line items (qty / unit price) while quotations are gathered
router.put('/:uuid/items', requirePermission('procurement:update'), validate(updateProcurementItemsSchema), procurementController.updateProcurementItems);

// Attach / remove a document (must precede DELETE /:uuid so '/documents/:uuid' wins)
router.post('/:uuid/documents', requirePermission('procurement:create'), validate(procurementDocumentSchema), procurementController.addDocument);
router.delete('/documents/:uuid', requirePermission('procurement:update'), procurementController.deleteDocument);
router.delete('/:uuid', requirePermission('procurement:delete'), procurementController.deleteProcurement);

// Quotations — admin fills them on a PR; requester picks one blind.
// (These must precede the generic /:uuid routes above.)
router.post('/:uuid/quotations', requirePermission('procurement:create'), validate(quotationSchema), procurementController.addQuotation);
router.put('/:uuid/quotations/:quotationUuid', requirePermission('procurement:update'), validate(updateQuotationSchema), procurementController.updateQuotation);
router.delete('/:uuid/quotations/:quotationUuid', requirePermission('procurement:delete'), procurementController.deleteQuotation);
router.post('/:uuid/submit-quotations', requirePermission('procurement:approve'), procurementController.submitQuotations);
router.post('/:uuid/select-quotation', requirePermission('procurement:approve'), validate(selectQuotationSchema), procurementController.selectQuotation);

// Workflow actions
router.post('/:uuid/submit', requirePermission('procurement:create'), validate(actionSchema), procurementController.submitProcurement);
router.post('/:uuid/approve', requirePermission('procurement:approve'), validate(actionSchema), procurementController.approveProcurement);
router.post('/:uuid/reject', requirePermission('procurement:approve'), validate(actionSchema), procurementController.rejectProcurement);
router.post('/:uuid/create-pr', requirePermission('procurement:po'), procurementController.createPr);
router.post('/:uuid/create-po', requirePermission('procurement:po'), procurementController.createPo);
// router.post('/:uuid/create-po', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), (req,res)=>{
//   console.log('this is test');
//   res.send('this is test');
// });
router.post('/:uuid/pay', requirePermission('procurement:pay'), procurementController.markPaid);

export default router;
