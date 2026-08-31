import { Router } from 'express';
import * as vendorController from './vendor.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { vendorDocumentSchema } from './vendor.validation.js';

const router = Router();
router.use(authMiddleware);

// Attach a document (uploaded file metadata) to a vendor
router.post('/', requirePermission('vendors:create'), validate(vendorDocumentSchema), vendorController.addVendorDocument);
// Remove one vendor document
router.delete('/:uuid', requirePermission('vendors:update'), vendorController.deleteVendorDocument);

export default router;
