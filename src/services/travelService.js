import api from '@/services/api';
import { crud } from '@/services/api';

// ── Travel requests (travel-expenses) ──
export const getTravelByExpense = (expenseUuid) => api.get(`/travel-expenses/by-expense/${expenseUuid}`);
export const createTravelWithExpense = (payload) => api.post('/travel-expenses/with-travel', payload);
export const updateTravelExpense = (uuid, payload) => api.put(`/travel-expenses/${uuid}`, payload);

// ── Travel sub-resources (standard CRUD) ──
export const segmentApi = crud('/travel-segments');
export const accommodationApi = crud('/travel-accommodations');
export const localTransportApi = crud('/travel-local-transports');
export const forexApi = crud('/travel-forex');
export const miscExpenseApi = crud('/travel-misc-expenses');
