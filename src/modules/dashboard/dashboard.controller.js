import * as dashboardService from './dashboard.service.js';
import ApiResponse from '../../utils/apiResponse.js';

export const getDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboard(req.user, req.query);
    return ApiResponse.success(res, data);
  } catch (error) {
    next(error);
  }
};