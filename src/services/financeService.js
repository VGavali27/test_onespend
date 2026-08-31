import { crud } from '@/services/api';

// ── Expense categories (Finance → Categories) ──
export const categoryApi = crud('/expense-categories');

// Payments & reports — add here when the backend endpoints exist
// (see backend/src/modules for payment/report modules).
