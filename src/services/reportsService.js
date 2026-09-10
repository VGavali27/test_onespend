import api from '@/services/api';

// ── Payments / CA report (GET /reports/payments) ──
// Debit-side ledger of every expense payment across the caller's company scope,
// with proof counts and the linked expense/category/company/vendor.
// Filters (all optional): dateFrom, dateTo, module, companyUuid, paymentMethod,
// paymentType, expenseStatus, paymentStatus, search, sortBy, sortOrder.

// Paginated ledger — feeds the DataTable on the Payments Report page.
export const getPaymentReport = (params, config) => api.get('/reports/payments', { params, ...config });

// Totals + breakdowns (disbursed/refund/net, by module/company/month, outstanding).
export const getPaymentReportSummary = (params, config) =>
  api.get('/reports/payments/summary', { params, ...config });

// Paginated per-expense net summary — one row per expense, grouped from
// merged payment + synthetic-advance rows. Same filters as the ledger.
export const getExpenseNetSummary = (params, config) =>
  api.get('/reports/payments/by-expense', { params, ...config });

// Full filtered result as a CSV file (blob) for export / sharing with the CA.
export const exportPaymentsReport = (params, config) =>
  api.get('/reports/payments/export', { params, responseType: 'blob', ...config });

// Per-expense net summary as a downloadable CSV.
export const exportExpenseNetSummary = (params, config) =>
  api.get('/reports/payments/by-expense/export', { params, responseType: 'blob', ...config });