import expenseCategoryService from './expense_category.service.js';
import ApiResponse from '../../utils/apiResponse.js';
// Fetch all expense categories
export const getAllCategories = async (_req, res, next) => {
  try {
    const categories = await expenseCategoryService.getAll();
    return ApiResponse.success(res, categories, 'Categories fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single category by UUID
export const getCategoryByUuid = async (req, res, next) => {
  try {
    const category = await expenseCategoryService.getByUuid(req.params.uuid);
    return ApiResponse.success(res, category, 'Category fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new expense category
export const createCategory = async (req, res, next) => {
  try {
    const category = await expenseCategoryService.create(req.body);
    return ApiResponse.created(res, category, 'Category created successfully');
  } catch (error) {
    next(error);
  }
};

// Update an existing category by UUID
export const updateCategory = async (req, res, next) => {
  try {
    const category = await expenseCategoryService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, category, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
};

// Soft delete a category by UUID
export const deleteCategory = async (req, res, next) => {
  try {
    const result = await expenseCategoryService.delete(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
