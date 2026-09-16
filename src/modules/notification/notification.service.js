import { Op } from 'sequelize';
import db from '../../database/models/index.js';
import * as roleRepository from '../role/role.repository.js';
import * as expenseRepository from '../expense/expense.repository.js';
import * as procurementRepository from '../procurement/procurement.repository.js';
import { getEmploymentIdsByUser, getActiveCompanyIdsByUser } from '../user_employment/user_employment.service.js';
import { decrypt } from '../../utils/encryption.js';
import { EXPENSE_GLOBAL_ROLES } from '../expense/expense.service.js';

const { Role, User, UserEmployment, ExpenseHandover, ProcurementHandover } = db;

// Roles that see every company's procurement documents (mirrors procurement.service.js)
const PROCUREMENT_GLOBAL_ROLES = ['SUPER_ADMIN', 'CFO'];
const PROCUREMENT_MANAGER_ROLES = [
  'SUPER_ADMIN', 'CFO', 'PAYMENT_MGR', 'PAYMENT_JR', 'FINANCE_MGR', 'FINANCE_JR',
  'ADMIN_MGR', 'ADMIN_JR', 'HOD',
];

// Normalize an amount to a currency string (decrypting if needed) without breaking
// on null / ciphertext — used for the dropdown's amount line.
const formatAmount = (value) => {
  if (value == null) return null;
  try {
    const decrypted = decrypt(String(value));
    return Number(decrypted).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch {
    return Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
};

const mapStatus = (status) => (status || '').replace(/_/g, ' ');

// ── Assignment feed: expenses pending approval at the user's role ──
const getAssignedExpenseRows = async (user, roleId) => {
  let companyIds = [];
  if (!EXPENSE_GLOBAL_ROLES.includes(user.roleCode)) {
    companyIds = await getActiveCompanyIdsByUser(user.userId);
  }
  const where = { current_role_id: roleId, status: 'SUBMITTED' };
  if (companyIds.length > 0) where.company_id = { [Op.in]: companyIds };
  const { rows } = await expenseRepository.findAll(where, { limit: 50, page: 1 });
  return rows.map((r) => ({
    bundle: 'assigned',
    kind: 'expense',
    module: 'expense',
    uuid: r.uuid,
    docType: 'EXPENSE',
    docId: r.id,
    ref: r.expense_number,
    title: r.title,
    status: mapStatus(r.status),
    amount: formatAmount(r.estimated_amount ?? r.final_amount),
    at: r.created_at ?? r.createdAt,
    link: `/expenses/${r.uuid}`,
  }));
};

// ── Assignment feed: procurement documents pending approval at the user's role ──
const getAssignedProcurementRows = async (user, roleId) => {
  const employmentIds = await getEmploymentIdsByUser(user.userId);
  const companyIds = await getActiveCompanyIdsByUser(user.userId);

  let scopeWhere = {};
  if (PROCUREMENT_GLOBAL_ROLES.includes(user.roleCode)) {
    scopeWhere = {};
  } else if (PROCUREMENT_MANAGER_ROLES.includes(user.roleCode)) {
    if (companyIds.length === 0) return [];
    scopeWhere = { company_id: { [Op.in]: companyIds } };
  } else {
    if (employmentIds.length === 0) return [];
    scopeWhere = { requested_by_employment_id: { [Op.in]: employmentIds } };
  }

  const combinedWhere = { [Op.and]: [scopeWhere, { current_role_id: roleId }] };
  const { rows } = await procurementRepository.findAll(combinedWhere, { limit: 50, page: 1 });
  return rows.map((r) => ({
    bundle: 'assigned',
    kind: 'procurement',
    module: 'procurement',
    uuid: r.uuid,
    docType: r.request_type,
    docId: r.id,
    ref: r.document_number,
    title: r.title,
    status: mapStatus(r.status),
    amount: formatAmount(r.grand_total),
    at: r.created_at ?? r.createdAt,
    link: `/procurement/${r.uuid}`,
  }));
};

// ── Payment feed: APPROVED/PAID expenses pending payment at the user's role ──
const getPaymentRows = async (user, roleId) => {
  let companyIds = [];
  if (!EXPENSE_GLOBAL_ROLES.includes(user.roleCode)) {
    companyIds = await getActiveCompanyIdsByUser(user.userId);
  }
  const where = {
    current_role_id: roleId,
    status: { [Op.in]: ['APPROVED', 'PAID'] },
    payment_status: { [Op.notIn]: ['SETTLED', 'PAID'] },
  };
  if (companyIds.length > 0) where.company_id = { [Op.in]: companyIds };
  const { rows } = await expenseRepository.findAll(where, { limit: 50, page: 1 });
  return rows.map((r) => ({
    bundle: 'assigned',
    kind: 'expense',
    module: 'payment',
    uuid: r.uuid,
    docType: 'EXPENSE',
    docId: r.id,
    ref: r.expense_number,
    title: r.title,
    status: mapStatus(r.payment_status),
    amount: formatAmount(r.final_amount ?? r.estimated_amount),
    at: r.created_at ?? r.createdAt,
    link: `/expenses/${r.uuid}`,
  }));
};

// ── Handover context for pending items ──
// The bell shows ONLY what is currently pending at the user's role (expense /
// procurement approvals + payment requests). For each pending document we attach
// the LATEST handover that routed it into the user's role — that gives:
//   from      → the person (action_by) who sent it
//   fromRole  → the role it came from
//   remarks   → the comment they left
const handoverActor = (h) => {
  const u = h?.actionBy?.user;
  if (!u) return null;
  return [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ') || u.email || null;
};

// Latest expense_handover per expense_id where the document landed in `roleId`.
const buildExpenseHandoverMap = async (items, roleId) => {
  const ids = [...new Set(items.map((n) => n.docId).filter(Boolean))];
  if (!ids.length) return new Map();
  const handovers = await ExpenseHandover.findAll({
    where: { to_role_id: roleId, expense_id: { [Op.in]: ids } },
    attributes: ['expense_id', 'remarks', 'created_at'],
    include: [
      { model: Role, as: 'fromRole', attributes: ['name'] },
      {
        model: UserEmployment,
        as: 'actionBy',
        include: [{ model: User, as: 'user', attributes: ['first_name', 'middle_name', 'last_name', 'email'] }],
      },
    ],
    order: [['created_at', 'DESC']],
  });
  const latest = new Map();
  for (const h of handovers) {
    if (!latest.has(h.expense_id)) latest.set(h.expense_id, h);
  }
  return latest;
};

// Latest procurement_handover per pending PI/PR/PO (keyed `PI:<id>` / `PR:<id>` / `PO:<id>`)
// that landed in `roleId`.
const buildProcurementHandoverMap = async (items, roleId) => {
  const rows = items.filter((n) => n.docType && n.docId != null);
  const or = [];
  for (const type of ['PI', 'PR', 'PO']) {
    const ids = rows.filter((n) => n.docType === type).map((n) => n.docId);
    if (ids.length) or.push({ [`${type.toLowerCase()}_id`]: { [Op.in]: ids } });
  }
  if (!or.length) return new Map();
  const handovers = await ProcurementHandover.findAll({
    where: { to_role_id: roleId, [Op.or]: or },
    attributes: ['id', 'pi_id', 'pr_id', 'po_id', 'remarks', 'created_at'],
    include: [
      { model: Role, as: 'fromRole', attributes: ['name'] },
      {
        model: UserEmployment,
        as: 'actionBy',
        include: [{ model: User, as: 'user', attributes: ['first_name', 'middle_name', 'last_name', 'email'] }],
      },
    ],
    order: [['created_at', 'DESC']],
  });
  const latest = new Map();
  for (const h of handovers) {
    const key = h.pi_id != null ? `PI:${h.pi_id}` : h.pr_id != null ? `PR:${h.pr_id}` : h.po_id != null ? `PO:${h.po_id}` : null;
    if (key && !latest.has(key)) latest.set(key, h);
  }
  return latest;
};

const applyHandoverInfo = (item, expenseMap, procurementMap) => {
  const out = { ...item };
  const { docType, docId } = out;
  delete out.docType;
  delete out.docId;
  const h =
    docType === 'EXPENSE'
      ? expenseMap.get(docId) ?? null
      : docType
        ? procurementMap.get(`${docType}:${docId}`) ?? null
        : null;
  if (h) {
    out.from = handoverActor(h);
    out.fromRole = h.fromRole?.name ?? null;
    out.remarks = h.remarks ?? null;
  }
  return out;
};

// ── Public: bell badge count ──
export const getNotificationCount = async (user) => {
  const role = await roleRepository.findByCode(user.roleCode);
  if (!role) {
    return { expenses: 0, procurement: 0, payments: 0, total: 0 };
  }

  const [expenses, procurement, payments] = await Promise.all([
    getAssignedExpenseRows(user, role.id),
    getAssignedProcurementRows(user, role.id),
    getPaymentRows(user, role.id),
  ]);

  const counts = {
    expenses: expenses.length,
    procurement: procurement.length,
    payments: payments.length,
  };
  counts.total = counts.expenses + counts.procurement + counts.payments;
  return counts;
};

// ── Public: merged dropdown feed (newest first) — pending items only ──
export const getNotifications = async (user, params = {}) => {
  const role = await roleRepository.findByCode(user.roleCode);
  if (!role) return [];

  const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
  const scope = params.scope;

  // Only what is CURRENTLY pending at the user's role — no history.
  const [assignedExpense, assignedProcurement, payments] = await Promise.all([
    getAssignedExpenseRows(user, role.id),
    getAssignedProcurementRows(user, role.id),
    getPaymentRows(user, role.id),
  ]);

  const [expenseMap, procurementMap] = await Promise.all([
    buildExpenseHandoverMap([...assignedExpense, ...payments], role.id),
    buildProcurementHandoverMap(assignedProcurement, role.id),
  ]);

  let feed = [
    ...assignedExpense.map((n) => applyHandoverInfo(n, expenseMap, procurementMap)),
    ...assignedProcurement.map((n) => applyHandoverInfo(n, expenseMap, procurementMap)),
    ...payments.map((n) => applyHandoverInfo(n, expenseMap, procurementMap)),
  ];
  if (scope === 'expense') feed = feed.filter((n) => n.module === 'expense');
  if (scope === 'procurement') feed = feed.filter((n) => n.module === 'procurement');

  feed.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  // Each pending document appears exactly once across the three feeds — this is
  // just a safety net, not the history-collapsing pass it used to be.
  const seen = new Set();
  feed = feed.filter((n) => {
    if (!n.link || seen.has(n.link)) return false;
    seen.add(n.link);
    return true;
  });

  return feed.slice(0, limit);
};
