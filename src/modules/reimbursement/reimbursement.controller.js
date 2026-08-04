import * as reimbursementService from './reimbursement.service.js';
import ApiResponse from '../../utils/apiResponse.js';

// Fetch a reimbursement by the associated expense UUID
export const getReimbursementByExpense = async (req, res, next) => {
  try {
    const reimbursement = await reimbursementService.getByExpenseUuid(req.params.expenseUuid);
    return ApiResponse.success(res, reimbursement, 'Reimbursement fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Update a reimbursement by UUID (header + items)
export const updateReimbursement = async (req, res, next) => {
  try {
    const reimbursement = await reimbursementService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, reimbursement, 'Reimbursement updated successfully');
  } catch (error) {
    next(error);
  }
};
