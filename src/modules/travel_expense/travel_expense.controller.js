import * as travelExpenseService from './travel_expense.service.js';
import ApiResponse from '../../utils/apiResponse.js';
// Get travel expense by expense UUID
export const getTravelByExpense = async (req, res, next) => {
  try {
    const travelExpense = await travelExpenseService.getByExpenseUuid(req.params.expenseUuid);
    return ApiResponse.success(res, travelExpense, 'Travel expense fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Combined create — expense + travel + child items
export const createWithTravel = async (req, res, next) => {
  try {
    const expense = await travelExpenseService.createWithTravel(req.body);
    return ApiResponse.created(res, expense, 'Expense with travel details created successfully');
  } catch (error) {
    next(error);
  }
};

// Update travel expense
export const updateTravelExpense = async (req, res, next) => {
  try {
    const travelExpense = await travelExpenseService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, travelExpense, 'Travel expense updated successfully');
  } catch (error) {
    next(error);
  }
};
