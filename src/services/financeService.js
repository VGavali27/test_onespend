import api from '@/services/api';
import { crud } from '@/services/api';

// ── Expense categories (Finance → Categories) ──
export const categoryApi = crud('/expense-categories');

// Lightweight dropdown options — [{ uuid, name, module }] for expense-category dropdowns
export const getCategoryOptions = () => api.get('/expense-categories/options');

// Payments & reports — add here when the backend endpoints exist
// (see backend/src/modules for payment/report modules).
