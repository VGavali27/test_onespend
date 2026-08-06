import { Router } from 'express';
import * as vendorController from './vendor.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { vendorDocumentSchema } from './vendor.validation.js';

const router = Router();
router.use(authMiddleware);

// Attach a document (uploaded file metadata) to a vendor
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), validate(vendorDocumentSchema), vendorController.addVendorDocument);
// Remove one vendor document
router.delete('/:uuid', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), vendorController.deleteVendorDocument);

export default router;
