import api from '@/services/api';

// ── Expenses ──
export const getExpenses = (params) => api.get('/expenses', { params });
export const getExpenseById = (uuid) => api.get(`/expenses/${uuid}`);
export const createExpense = (payload) => api.post('/expenses', payload);
export const updateExpense = (uuid, payload) => api.put(`/expenses/${uuid}`, payload);
export const deleteExpense = (uuid) => api.delete(`/expenses/${uuid}`);

// Expense documents & handovers — add here when the backend endpoints exist.
