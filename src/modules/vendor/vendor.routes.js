import { Router } from 'express';
import * as vendorController from './vendor.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { createVendorSchema, updateVendorSchema } from './vendor.validation.js';

const router = Router();
router.use(authMiddleware);

// List vendors
router.get('/', requirePermission('vendors:read_all'), vendorController.getAllVendors);
// Lightweight vendor options for dropdowns (must precede /:uuid)
router.get('/options', requirePermission('vendors:read'), vendorController.getVendorOptions);
// Get a single vendor by UUID (full detail with children)
router.get('/:uuid', requirePermission('vendors:read'), vendorController.getVendorByUuid);
// Create a vendor (with nested contacts/addresses/bank accounts)
router.post('/', requirePermission('vendors:create'), validate(createVendorSchema), vendorController.createVendor);
// Update a vendor by UUID
router.put('/:uuid', requirePermission('vendors:update'), validate(updateVendorSchema), vendorController.updateVendor);
// Soft delete a vendor by UUID
router.delete('/:uuid', requirePermission('vendors:delete'), vendorController.deleteVendor);

export default router;
