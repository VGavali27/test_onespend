import { Router } from 'express';
import * as expenseCategoryController from './expense_category.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { createExpenseCategorySchema, updateExpenseCategorySchema } from './expense_category.validation.js';
const router = Router();
router.use(authMiddleware);
// List all expense categories
router.get('/', requirePermission('expense_categories:read_all'), expenseCategoryController.getAllCategories);
// Lightweight expense category options for dropdowns (must precede /:uuid)
router.get('/options', requirePermission('expense_categories:read'), expenseCategoryController.getCategoryOptions);
// Get a single category by UUID
router.get('/:uuid', requirePermission('expense_categories:read'), expenseCategoryController.getCategoryByUuid);
// Create a new category (validate body first)
router.post('/', requirePermission('expense_categories:create'), validate(createExpenseCategorySchema), expenseCategoryController.createCategory);
// Update an existing category by UUID (validate body first)
router.put('/:uuid', requirePermission('expense_categories:update'), validate(updateExpenseCategorySchema), expenseCategoryController.updateCategory);
// Soft delete a category by UUID
router.delete('/:uuid', requirePermission('expense_categories:delete'), expenseCategoryController.deleteCategory);
export default router;
