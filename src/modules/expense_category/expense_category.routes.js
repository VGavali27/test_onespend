import { Router } from 'express';
import * as expenseCategoryController from './expense_category.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createExpenseCategorySchema, updateExpenseCategorySchema } from './expense_category.validation.js';
const router = Router();
router.use(authMiddleware);
// List all expense categories
router.get('/', expenseCategoryController.getAllCategories);
// Get a single category by UUID
router.get('/:uuid', expenseCategoryController.getCategoryByUuid);
// Create a new category (validate body first)
router.post('/', validate(createExpenseCategorySchema), expenseCategoryController.createCategory);
// Update an existing category by UUID (validate body first)
router.put('/:uuid', validate(updateExpenseCategorySchema), expenseCategoryController.updateCategory);
// Soft delete a category by UUID
router.delete('/:uuid', expenseCategoryController.deleteCategory);
export default router;
