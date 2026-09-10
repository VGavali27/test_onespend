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
// ADVANCE is synthetic (see buildSyntheticAdvances) — a reimbursement advance
// is company money paid out up-front, so it counts as a disbursement too.
const DISBURSEMENT_TYPES = new Set(['PARTIAL', 'FULL', 'ADDITIONAL', 'ADVANCE']);

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
          submitted_at: e.submitted_at ?? null,
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

// Reimbursement advances are company money paid out up-front, so they count as
// disbursements — but the DB stores no expense_payments row for them (payments
// are only recorded after the fact). One synthetic ADVANCE row per expense uuid,
// dated from the earliest recorded payment for that expense, falling back to its
// submission date. |rows| must already be mapPayment-mapped.
const buildSyntheticAdvances = (rows) => {
  const earliestByExpense = new Map();
  for (const r of rows) {
    if (r.expense?.module !== 'reimbursement') continue;
    const cur = earliestByExpense.get(r.expense.uuid);
    if (!cur || (r.payment_date && (!cur.payment_date || r.payment_date < cur.payment_date))) {
      earliestByExpense.set(r.expense.uuid, r);
    }
  }

  const advances = [];
  const seen = new Set();
  for (const r of rows) {
    const amt = Number(r.expense?.advance_amount || 0);
    if (r.expense?.module !== 'reimbursement' || amt <= 0 || seen.has(r.expense.uuid)) continue;
    seen.add(r.expense.uuid);
    const earliest = earliestByExpense.get(r.expense.uuid);
    advances.push({
      uuid: `advance-${r.expense.uuid}`,
      payment_date: earliest?.payment_date ?? r.expense.submitted_at ?? null,
      amount: amt,
      payment_method: 'ADVANCE',
      payment_type: 'ADVANCE',
      reference_number: null,
      remarks: null,
      proof_count: 0,
      expense: { ...r.expense },
      company: r.company,
      vendor: r.vendor,
      requester: r.requester,
      processed_by: r.processed_by,
    });
  }
  return advances;
};

// Paginated payments ledger.
export const getPaymentReport = async (user, query = {}) => {
  const where = await buildWhere(user, query);
  const order = buildOrder(query);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(query.limit) || 10));

  const { rows } = await reportsRepository.findAndCountPayments(
    where,
    order,
    limit,
    (page - 1) * limit,
  );
  const mapped = rows.map(mapPayment);
  const merged = [...mapped, ...buildSyntheticAdvances(mapped)];
  return { rows: merged, total: merged.length };
};

// Totals + breakdowns for the summary cards. Composite math runs in JS because
// amounts are encrypted — they can't be SUM()ed in SQL.
export const getPaymentSummary = async (user, query = {}) => {
  const where = await buildWhere(user, query);
  const rows = (await reportsRepository.findAllPayments(where, [['payment_date', 'ASC'], ['id', 'ASC']]))
    .map(mapPayment);
  rows.push(...buildSyntheticAdvances(rows));

  let totalDisbursed = 0;
  let totalRefunds = 0;
  let disbursementCount = 0;
  let refundCount = 0;
  const byModule = new Map();
  const byCompany = new Map();
  const byMonth = new Map();
  const expenseMap = new Map();
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

    if (r.expense) {
      const key = r.expense.uuid;
      const entry = expenseMap.get(key) || {
        expense_uuid: key,
        expense_number: r.expense.expense_number,
        title: r.expense.title,
        module: r.expense.module ?? 'unknown',
        category_name: r.expense.category_name,
        company_name: r.company?.name ?? null,
        advance: Number(r.expense.advance_amount) || 0,
        disbursed: 0,
        refunded: 0,
        advance_date: null,
        disbursed_date: null,
        refund_date: null,
        last_date: null,
      };
      if (isRefund) {
        entry.refunded += r.amount;
        if (r.payment_date && (!entry.refund_date || r.payment_date > entry.refund_date)) entry.refund_date = r.payment_date;
      } else {
        entry.disbursed += r.amount;
        if (r.payment_date && (!entry.disbursed_date || r.payment_date > entry.disbursed_date)) entry.disbursed_date = r.payment_date;
      }
      if (r.payment_type === 'ADVANCE') entry.advance_date = r.payment_date;
      if (r.payment_date && (!entry.last_date || r.payment_date > entry.last_date)) entry.last_date = r.payment_date;
      expenseMap.set(key, entry);
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
    // One line per expense — the CA-level net view. Clubbed across the expense's
    // recorded payments + its synthetic advance row, so the 800/1000/200 case
    // reads advance 800 · paid 200 · net 1000 and the 900/600/300 case reads
    // advance 900 · refunded 300 · net 600.
    by_expense: [...expenseMap.values()].map((x) => ({ ...x, net: x.disbursed - x.refunded })),
    outstanding,
  };
};

// Paginated per-expense net summary — one row per expense, grouped from the
// merged payment + synthetic-advance rows. Amounts are encrypted so grouping
// must happen in JS; the underlying query fetches all matching payment rows,
// then groups + paginates the result.
const EXPENSE_NET_SORTABLE = new Set(['expense_number', 'title', 'advance', 'disbursed', 'refunded', 'net', 'last_date']);

export const getExpenseNetSummary = async (user, query = {}) => {
  const where = await buildWhere(user, query);
  const rows = (await reportsRepository.findAllPayments(where, [['payment_date', 'ASC'], ['id', 'ASC']]))
    .map(mapPayment);
  rows.push(...buildSyntheticAdvances(rows));

  // Group by expense UUID
  const expenseMap = new Map();
  for (const r of rows) {
    if (!r.expense) continue;
    const key = r.expense.uuid;
    const isRefund = !DISBURSEMENT_TYPES.has(r.payment_type);
    const entry = expenseMap.get(key) || {
      expense_uuid: key,
      expense_number: r.expense.expense_number,
      title: r.expense.title,
      module: r.expense.module ?? 'unknown',
      category_name: r.expense.category_name,
      company_name: r.company?.name ?? null,
      advance: Number(r.expense.advance_amount) || 0,
      disbursed: 0,
      refunded: 0,
      advance_date: null,
      disbursed_date: null,
      refund_date: null,
      last_date: null,
    };
    if (isRefund) {
      entry.refunded += r.amount;
      if (r.payment_date && (!entry.refund_date || r.payment_date > entry.refund_date)) entry.refund_date = r.payment_date;
    } else {
      entry.disbursed += r.amount;
      if (r.payment_date && (!entry.disbursed_date || r.payment_date > entry.disbursed_date)) entry.disbursed_date = r.payment_date;
    }
    if (r.payment_type === 'ADVANCE') entry.advance_date = r.payment_date;
    if (r.payment_date && (!entry.last_date || r.payment_date > entry.last_date)) entry.last_date = r.payment_date;
    expenseMap.set(key, entry);
  }

  // Compute net for each entry
  let grouped = [...expenseMap.values()].map((x) => ({ ...x, net: x.disbursed - x.refunded }));

  // Sort
  const sortDir = String(query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  const sortBy = EXPENSE_NET_SORTABLE.has(query.sortBy) ? query.sortBy : 'last_date';
  grouped.sort((a, b) => {
    const av = a[sortBy] ?? 0;
    const bv = b[sortBy] ?? 0;
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === 'string') return av.localeCompare(bv) * sortDir;
    return (av - bv) * sortDir;
  });

  // Paginate
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const total = grouped.length;
  const start = (page - 1) * limit;
  const paged = grouped.slice(start, start + limit);

  return { rows: paged, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// Per-expense net summary as a downloadable CSV.
export const exportExpenseNetCsv = async (user, query = {}) => {
  const where = await buildWhere(user, query);
  const rows = (await reportsRepository.findAllPayments(where, [['payment_date', 'ASC'], ['id', 'ASC']]))
    .map(mapPayment);
  rows.push(...buildSyntheticAdvances(rows));

  const expenseMap = new Map();
  for (const r of rows) {
    if (!r.expense) continue;
    const key = r.expense.uuid;
    const isRefund = !DISBURSEMENT_TYPES.has(r.payment_type);
    const entry = expenseMap.get(key) || {
      expense_number: r.expense.expense_number,
      title: r.expense.title,
      module: r.expense.module ?? 'unknown',
      category_name: r.expense.category_name,
      company_name: r.company?.name ?? null,
      advance: Number(r.expense.advance_amount) || 0,
      disbursed: 0,
      refunded: 0,
      advance_date: null,
      disbursed_date: null,
      refund_date: null,
      last_date: null,
    };
    if (isRefund) {
      entry.refunded += r.amount;
      if (r.payment_date && (!entry.refund_date || r.payment_date > entry.refund_date)) entry.refund_date = r.payment_date;
    } else {
      entry.disbursed += r.amount;
      if (r.payment_date && (!entry.disbursed_date || r.payment_date > entry.disbursed_date)) entry.disbursed_date = r.payment_date;
    }
    if (r.payment_type === 'ADVANCE') entry.advance_date = r.payment_date;
    if (r.payment_date && (!entry.last_date || r.payment_date > entry.last_date)) entry.last_date = r.payment_date;
    expenseMap.set(key, entry);
  }

  const grouped = [...expenseMap.values()].map((x) => ({ ...x, net: x.disbursed - x.refunded }));

  const header = [
    'Expense No.', 'Title', 'Module', 'Category', 'Company',
    'Advance', 'Advance Date', 'Paid Out', 'Paid Out Date',
    'Refunded', 'Refunded Date', 'Net', 'Last Activity',
  ];
  const csvCell = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const toLine = (values) => values.map(csvCell).join(',');

  const lines = grouped.map((r) =>
    toLine([
      r.expense_number,
      r.title,
      r.module,
      r.category_name,
      r.company_name,
      r.advance.toFixed(2),
      r.advance_date ? r.advance_date.toISOString() : '',
      r.disbursed.toFixed(2),
      r.disbursed_date ? r.disbursed_date.toISOString() : '',
      r.refunded.toFixed(2),
      r.refund_date ? r.refund_date.toISOString() : '',
      r.net.toFixed(2),
      r.last_date ? r.last_date.toISOString() : '',
    ]),
  );

  return `\uFEFF${toLine(header)}\n${lines.join('\n')}`;
};

// Full filtered result as a CSV string (BOM-prefixed so Excel opens UTF-8 correctly).
export const exportPaymentsCsv = async (user, query = {}) => {
  const where = await buildWhere(user, query);
  const rows = (await reportsRepository.findAllPayments(where, [['payment_date', 'ASC'], ['id', 'ASC']]))
    .map(mapPayment);
  rows.push(...buildSyntheticAdvances(rows));

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