import api from '@/services/api';

// ── Auth ──
export const login = (email, password) => api.post('/auth/login', { email, password });

// Forgot password / refresh token / profile endpoints — add here
// when the backend exposes them (see backend/src/modules/auth).
