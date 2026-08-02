import axios from 'axios';

/**
 * Shared axios client — the ONLY place axios is configured.
 * Every API call goes through this instance, which handles:
 *  - base URL (from env, defaults to local backend)
 *  - JSON headers
 *  - attaching the JWT on every request
 *  - centralized error handling (401 → clear session + redirect to login)
 *
 * Endpoint functions live in the domain service files (authService, expenseService, ...),
 * NOT here. This file only owns the client + shared helpers.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized error handling. One place to normalize failures instead of
// repeating try/catch in every service. Refine this as the app grows
// (e.g. toast on 400, custom message mapping).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired / invalid token — clear and bounce to login.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Standard CRUD helper for REST resources that follow the same pattern
 * (list / get / create / update / delete on a base path).
 *
 * Usage:
 *   const companyApi = crud('/companies');
 *   const list = await companyApi.list({ page: 1 });
 *   const one = await companyApi.get(uuid);
 */
export const crud = (base) => ({
  list: (params) => api.get(base, { params }),
  get: (uuid) => api.get(`${base}/${uuid}`),
  create: (payload) => api.post(base, payload),
  update: (uuid, payload) => api.put(`${base}/${uuid}`, payload),
  remove: (uuid) => api.delete(`${base}/${uuid}`),
});

export default api;
