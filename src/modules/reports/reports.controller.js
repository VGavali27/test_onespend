import * as reportsService from './reports.service.js';
import ApiResponse from '../../utils/apiResponse.js';

// Payments ledger (paginated) — filters: dateFrom/dateTo/module/companyUuid/
// paymentMethod/paymentType/expenseStatus/paymentStatus/search/sort.
export const getPaymentReport = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 10));
    const { rows, total } = await reportsService.getPaymentReport(req.user, req.query);
    return ApiResponse.paginated(res, rows, { page, limit, total });
  } catch (error) {
    next(error);
  }
};

// Summary cards + breakdowns for the same filter set (no pagination).
export const getPaymentSummary = async (req, res, next) => {
  try {
    const data = await reportsService.getPaymentSummary(req.user, req.query);
    return ApiResponse.success(res, data, 'Payment summary fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Full filtered result as a downloadable CSV.
export const exportPayments = async (req, res, next) => {
  try {
    const csv = await reportsService.exportPaymentsCsv(req.user, req.query);
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="payments-report-${stamp}.csv"`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};