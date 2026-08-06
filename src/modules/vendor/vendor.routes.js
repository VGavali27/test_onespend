import { Router } from 'express';
import * as vendorController from './vendor.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { createVendorSchema, updateVendorSchema } from './vendor.validation.js';

const router = Router();
router.use(authMiddleware);

// List vendors
router.get('/', vendorController.getAllVendors);
// Lightweight vendor options for dropdowns (must precede /:uuid)
router.get('/options', vendorController.getVendorOptions);
// Get a single vendor by UUID (full detail with children)
router.get('/:uuid', vendorController.getVendorByUuid);
// Create a vendor (with nested contacts/addresses/bank accounts)
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), validate(createVendorSchema), vendorController.createVendor);
// Update a vendor by UUID
router.put('/:uuid', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), validate(updateVendorSchema), vendorController.updateVendor);
// Soft delete a vendor by UUID
router.delete('/:uuid', requireRole('SUPER_ADMIN'), vendorController.deleteVendor);

export default router;
