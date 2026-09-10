import api from './api';

export const getNotificationCount = (config) => api.get('/notifications/count', config);

export const getNotifications = (params, config) => api.get('/notifications', { params, ...config });
