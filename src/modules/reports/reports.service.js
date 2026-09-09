import * as companyRepository from '../company/company.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
import { decrypt } from '../../utils/encryption.js';
import { getActiveCompanyIdsByUser } from '../user_employment/user_employment.service.js';
import * as reportsRepository from './reports.repository.js';

const { Op } = db.Sequelize;

// Roles that see every company's payments. Everything else is company-scoped.
export const REPORT_GLOBAL_ROLES = ['SUPER_ADMIN', 'CFO'];
// Roles allowed past the payments:reports permission (also enforces company scope).
export const REPORT_MANAGER_ROLES = ['SUPER_ADMIN', 'CFO', 'PAYMENT_MGR', 'PAYMENT_JR', 'FINANCE_MGR', 'FINANCE_JR'];

// payment_type direction: these flow company → user/vendor (disbursement);
// the rest (ADVANCE_REFUND / REFUND_RECEIVED) flow user → company (refund).
const DISBURSEMENT_TYPES = new Set(['PARTIAL', 'FULL', 'ADDITIONAL']);

const SORTABLE_COLUMNS = new Set(['payment_date', 'payment_method', 'payment_type', 'reference_number', 'created_at']);

const escapeLike = (term) => String(term).replace(/[\\%_]/g, (ch) => `\\${ch}`);

// Company/role scope for the logged-in user, expressed against the included
// expense (`$expense.company_id$` references the joined alias).
const buildScopeWhere = async (user) => {
  if (REPORT_GLOBAL_ROLES.includes(user.roleCode)) return {};
  if (!REPORT_MANAGER_ROLES.includes(user.roleCode)) {
    throw ApiError.forbidden('Not allowed to view payment reports');
  }
  const companyIds = await getActiveCompanyIdsByUser(user.userId);
  if (companyIds.length === 0) return { '$expense.company_id$': { [Op.in]: [] } };
  return { '$expense.company_id$': { [Op.in]: companyIds } };
};

// Combine report filters (scope + query params) into a Sequelize where object.
const buildWhere = async (user, query = {}) => {
  const { dateFrom, dateTo, module, companyUuid, paymentMethod, paymentType, expenseStatus, paymentStatus, search } = query;
  const where = await buildScopeWhere(user);

  if (dateFrom || dateTo) {
    where.payment_date = {};
    if (dateFrom) where.payment_date[Op.gte] = new Date(dateFrom);
    if (dateTo) where.payment_date[Op.lte] = new Date(`${dateTo}T23:59:59.999Z`);
  }
  if (paymentMethod) where.payment_method = paymentMethod;
  if (paymentType) where.payment_type = paymentType;
  if (module) where['$expense.category.module$'] = module;
  if (expenseStatus) where['$expense.status$'] = expenseStatus;
  if (paymentStatus) where['$expense.payment_status$'] = paymentStatus;

  if (companyUuid) {
    const company = await companyRepository.findByUuid(companyUuid);
    if (!company) throw ApiError.notFound('Company not found');
    where['$expense.company_id$'] = company.id;
  }

  if (search) {
    const like = `%${escapeLike(search)}%`;
    where[Op.or] = [
      { '$expense.title$': { [Op.like]: like } },
      { '$expense.expense_number$': { [Op.like]: like } },
      { reference_number: { [Op.like]: like } },
    ];
  }

  return where;
};

const buildOrder = (query = {}) => {
  const dir = String(query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const col = SORTABLE_COLUMNS.has(query.sortBy) ? query.sortBy : 'payment_date';
  return [[col, dir], ['id', 'DESC']];
};

const userName = (u) => (u ? [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email : null);

// Map one ExpensePayment row (with includes) into the report ledger shape.
const mapPayment = (p) => {
  const e = p.expense;
  const cat = e?.category;
  const co = e?.company;
  const vendor = e?.procurementOrder?.vendor ?? null;
  return {
    uuid: p.uuid,
    payment_date: p.payment_date,
    amount: Number(decrypt(p.amount)) || 0,
    payment_method: p.payment_method,
    payment_type: p.payment_type,
    reference_number: p.reference_number,
    remarks: p.remarks,
    proof_count: p.dataValues?.proofCount ?? 0,
    expense: e
      ? {
          uuid: e.uuid,
          title: e.title,
          expense_number: e.expense_number,
          status: e.status,
          payment_status: e.payment_status,
          final_amount: Number(decrypt(e.final_amount)) || 0,
          advance_amount: Number(decrypt(e.advance_amount)) || 0,
          paid_amount: Number(decrypt(e.paid_amount)) || 0,
          module: cat?.module ?? null,
          category_name: cat?.name ?? null,
        }
      : null,
    company: co ? { uuid: co.uuid, name: co.name, gst_number: co.gst_number, pan_number: co.pan_number } : null,
    vendor: vendor ? { uuid: vendor.uuid, name: vendor.name, code: vendor.code, gst_number: vendor.gst_number } : null,
    requester: userName(e?.requestedByEmployment?.user),
    processed_by: userName(p.processedByEmployment?.user),
  };
};

// Paginated payments ledger.
export const getPaymentReport = async (user, query = {}) => {
  const where = await buildWhere(user, query);
  const order = buildOrder(query);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(query.limit) || 10));

  const { rows, count } = await reportsRepository.findAndCountPayments(
    where,
    order,
    limit,
    (page - 1) * limit,
  );
  return { rows: rows.map(mapPayment), total: count };
};

// Totals + breakdowns for the summary cards. Composite math runs in JS because
// amounts are encrypted — they can't be SUM()ed in SQL.
export const getPaymentSummary = async (user, query = {}) => {
  const where = await buildWhere(user, query);
  const rows = (await reportsRepository.findAllPayments(where, [['payment_date', 'ASC'], ['id', 'ASC']])).map(mapPayment);

  let totalDisbursed = 0;
  let totalRefunds = 0;
  let disbursementCount = 0;
  let refundCount = 0;
  const byModule = new Map();
  const byCompany = new Map();
  const byMonth = new Map();
  const monthKey = (d) => (d ? d.toISOString().slice(0, 7) : 'unknown');

  for (const r of rows) {
    const isRefund = !DISBURSEMENT_TYPES.has(r.payment_type);
    if (isRefund) {
      totalRefunds += r.amount;
      refundCount += 1;
    } else {
      totalDisbursed += r.amount;
      disbursementCount += 1;
    }

    const mod = r.expense?.module ?? 'unknown';
    const mEntry = byModule.get(mod) || { module: mod, count: 0, disbursed: 0, refunds: 0 };
    mEntry.count += 1;
    if (isRefund) mEntry.refunds += r.amount;
    else mEntry.disbursed += r.amount;
    byModule.set(mod, mEntry);

    const coId = r.company?.uuid ?? 'unknown';
    const cEntry = byCompany.get(coId) || {
      company_uuid: r.company?.uuid ?? null,
      company_name: r.company?.name ?? 'Unknown',
      gst_number: r.company?.gst_number ?? null,
      count: 0,
      disbursed: 0,
      refunds: 0,
    };
    cEntry.count += 1;
    if (isRefund) cEntry.refunds += r.amount;
    else cEntry.disbursed += r.amount;
    byCompany.set(coId, cEntry);

    const mk = monthKey(r.payment_date);
    const bEntry = byMonth.get(mk) || { month: mk, count: 0, disbursed: 0, refunds: 0 };
    bEntry.count += 1;
    if (isRefund) bEntry.refunds += r.amount;
    else bEntry.disbursed += r.amount;
    byMonth.set(mk, bEntry);
  }

  const scopeWhere = await buildScopeWhere(user);
  const outstanding = (await reportsRepository.findOutstandingExpenses(scopeWhere)).reduce(
    (acc, e) => {
      const finalAmt = Number(decrypt(e.final_amount)) || 0;
      const advance = Number(decrypt(e.advance_amount)) || 0;
      const paid = Number(decrypt(e.paid_amount)) || 0;
      const due = Math.max(0, finalAmt - advance - paid);
      if (due > 0) {
        acc.count += 1;
        acc.amount_due += due;
      }
      return acc;
    },
    { count: 0, amount_due: 0 },
  );

  return {
    total_disbursed: totalDisbursed,
    total_refunds: totalRefunds,
    net_paid: totalDisbursed - totalRefunds,
    payment_count: rows.length,
    disbursement_count: disbursementCount,
    refund_count: refundCount,
    by_module: [...byModule.values()],
    by_company: [...byCompany.values()],
    by_month: [...byMonth.values()],
    outstanding,
  };
};

// Full filtered result as a CSV string (BOM-prefixed so Excel opens UTF-8 correctly).
export const exportPaymentsCsv = async (user, query = {}) => {
  const where = await buildWhere(user, query);
  const rows = (await reportsRepository.findAllPayments(where, [['payment_date', 'ASC'], ['id', 'ASC']])).map(mapPayment);

  const header = [
    'Payment date', 'Amount', 'Method', 'Type', 'Reference', 'Remarks', 'Proofs',
    'Expense no.', 'Title', 'Expense status', 'Payment status',
    'Module', 'Category', 'Company', 'Company GST', 'Vendor', 'Vendor GST',
    'Requester', 'Processed by',
  ];
  const csvCell = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const toLine = (values) => values.map(csvCell).join(',');

  const lines = rows.map((r) =>
    toLine([
      r.payment_date ? r.payment_date.toISOString() : '',
      r.amount.toFixed(2),
      r.payment_method,
      r.payment_type,
      r.reference_number,
      r.remarks,
      r.proof_count,
      r.expense?.expense_number,
      r.expense?.title,
      r.expense?.status,
      r.expense?.payment_status,
      r.expense?.module,
      r.expense?.category_name,
      r.company?.name,
      r.company?.gst_number,
      r.vendor?.name,
      r.vendor?.gst_number,
      r.requester,
      r.processed_by,
    ]),
  );

  return `\uFEFF${toLine(header)}\n${lines.join('\n')}`;
};