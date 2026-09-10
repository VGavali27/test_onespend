import api from '@/services/api';

export const getLogDates = (config) =>
  api.get('/system/logs/meta', { ...config });

export const getApiLogs = (params, config) =>
  api.get('/system/logs/api', { ...config, params });

export const getErrorLogs = (params, config) =>
  api.get('/system/logs/error', { ...config, params });