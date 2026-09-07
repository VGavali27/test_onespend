import * as notificationService from './notification.service.js';
import ApiResponse from '../../utils/apiResponse.js';

export const getNotificationCount = async (req, res, next) => {
  try {
    const count = await notificationService.getNotificationCount(req.user);
    return ApiResponse.success(res, count, 'Notification count retrieved');
  } catch (error) {
    return next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getNotifications(req.user, req.query);
    return ApiResponse.success(res, data, 'Notifications retrieved');
  } catch (error) {
    return next(error);
  }
};
