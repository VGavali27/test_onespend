import { Router } from 'express';
import * as vendorCategoryController from './vendor_category.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { createVendorCategorySchema, updateVendorCategorySchema } from './vendor_category.validation.js';

const router = Router();
router.use(authMiddleware);

router.get('/', requirePermission('vendor_categories:read_all'), vendorCategoryController.getAllVendorCategories);
router.get('/options', requirePermission('vendor_categories:read'), vendorCategoryController.getVendorCategoryOptions);
router.get('/:uuid', requirePermission('vendor_categories:read'), vendorCategoryController.getVendorCategoryByUuid);
router.post('/', requirePermission('vendor_categories:create'), validate(createVendorCategorySchema), vendorCategoryController.createVendorCategory);
router.put('/:uuid', requirePermission('vendor_categories:update'), validate(updateVendorCategorySchema), vendorCategoryController.updateVendorCategory);
router.delete('/:uuid', requirePermission('vendor_categories:delete'), vendorCategoryController.deleteVendorCategory);

export default router;
