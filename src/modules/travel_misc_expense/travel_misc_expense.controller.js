import miscExpenseService from './travel_misc_expense.service.js';

import ApiResponse from '../../utils/apiResponse.js';

// Fetch all misc expenses
export const getAll = async (_req, res, next) => {
  try {
    const data = await miscExpenseService.getAll();
    return ApiResponse.success(res, data, 'Misc expenses fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single misc expense by UUID
export const getByUuid = async (req, res, next) => {
  try {
    const data = await miscExpenseService.getByUuid(req.params.uuid);
    return ApiResponse.success(res, data, 'Misc expense fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new misc expense
export const create = async (req, res, next) => {
  try {
    const data = await miscExpenseService.create(req.body);
    return ApiResponse.created(res, data, 'Misc expense created successfully');
  } catch (error) {
    next(error);
  }
};

// Update an existing misc expense by UUID
export const update = async (req, res, next) => {
  try {
    const data = await miscExpenseService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, data, 'Misc expense updated successfully');
  } catch (error) {
    next(error);
  }
};

// Soft delete a misc expense by UUID
export const deleteRecord = async (req, res, next) => {
  try {
    const result = await miscExpenseService.delete(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
