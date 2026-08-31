import api from '@/services/api';

export const getDashboard = (params, config) =>
  api.get('/dashboard', { ...config, params });