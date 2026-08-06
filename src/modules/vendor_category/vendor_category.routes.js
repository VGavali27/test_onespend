import { Router } from 'express';
import * as vendorCategoryController from './vendor_category.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { createVendorCategorySchema, updateVendorCategorySchema } from './vendor_category.validation.js';

const router = Router();
router.use(authMiddleware);

router.get('/', vendorCategoryController.getAllVendorCategories);
router.get('/options', vendorCategoryController.getVendorCategoryOptions);
router.get('/:uuid', vendorCategoryController.getVendorCategoryByUuid);
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), validate(createVendorCategorySchema), vendorCategoryController.createVendorCategory);
router.put('/:uuid', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), validate(updateVendorCategorySchema), vendorCategoryController.updateVendorCategory);
router.delete('/:uuid', requireRole('SUPER_ADMIN'), vendorCategoryController.deleteVendorCategory);

export default router;
