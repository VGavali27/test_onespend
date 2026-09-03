import * as systemLogsService from './system_logs.service.js';
import ApiResponse from '../../utils/apiResponse.js';

export const getLogDates = async (_req, res, next) => {
  try {
    const dates = await systemLogsService.listLogDates();
    return ApiResponse.success(res, dates, 'Log dates retrieved');
  } catch (error) {
    return next(error);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const data = await systemLogsService.getLogsForDate(req.query.date);
    return ApiResponse.success(res, data, 'Logs retrieved');
  } catch (error) {
    return next(error);
  }
};

export const getErrorLogs = async (req, res, next) => {
  try {
    const data = await systemLogsService.getLogsForType(req.query.date, 'error');
    return ApiResponse.success(res, data, 'Error logs retrieved');
  } catch (error) {
    return next(error);
  }
};

export const getApiLogs = async (req, res, next) => {
  try {
    const data = await systemLogsService.getLogsForType(req.query.date, 'api');
    return ApiResponse.success(res, data, 'API logs retrieved');
  } catch (error) {
    return next(error);
  }
};