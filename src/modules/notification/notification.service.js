import { Op } from 'sequelize';
import db from '../../database/models/index.js';
import * as roleRepository from '../role/role.repository.js';
import * as expenseRepository from '../expense/expense.repository.js';
import * as procurementRepository from '../procurement/procurement.repository.js';
import { getEmploymentIdsByUser, getActiveCompanyIdsByUser } from '../user_employment/user_employment.service.js';
import { decrypt } from '../../utils/encryption.js';
import { EXPENSE_GLOBAL_ROLES, EXPENSE_MANAGER_ROLES } from '../expense/expense.service.js';

const { Role, Expense, ExpenseHandover, ProcurementHandover } = db;

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
    ref: r.expense_number,
    title: r.title,
    status: mapStatus(r.payment_status),
    amount: formatAmount(r.final_amount ?? r.estimated_amount),
    at: r.created_at ?? r.createdAt,
    link: `/expenses/${r.uuid}`,
  }));
};

// ── Activity feed: recent handovers that involve the logged-in user ──
// Mirrors the "Assigned/Approvals" visibility scoping. Includes rows where:
//   - the action was directed at the user's role (to_role_id = my role), OR
//   - the document creator is the user (an approval/reject that affects their request).
// Which header table a procurement handover belongs to is resolved via the repository
// so we can build a correct deep link.
const getActivityRows = async (user, roleId) => {
  const isExpenseGlobal = EXPENSE_GLOBAL_ROLES.includes(user.roleCode);
  const isExpenseManager = EXPENSE_MANAGER_ROLES.includes(user.roleCode);
  const isProcGlobal = PROCUREMENT_GLOBAL_ROLES.includes(user.roleCode);
  const isProcManager = PROCUREMENT_MANAGER_ROLES.includes(user.roleCode);

  const companyIds = await getActiveCompanyIdsByUser(user.userId);

  // Expense handovers — activity only makes sense for manager roles (or global).
  let expenseActivity = [];
  if (isExpenseGlobal || isExpenseManager) {
    const scope = isExpenseGlobal ? {} : companyIds.length ? { company_id: { [Op.in]: companyIds } } : null;
    if (scope !== null) {
      const rows = await ExpenseHandover.findAll({
        where: {
          to_role_id: expenseRoleIds,
        },
        include: [
          {
            model: Expense,
            as: 'expense',
            where: { ...scope, status: { [Op.ne]: 'DRAFT' } },
            required: true,
          },
          { model: Role, as: 'fromRole', attributes: ['name'] },
          { model: Role, as: 'toRole', attributes: ['name'] },
        ],
        order: [['created_at', 'DESC']],
        limit: 30,
      });
      expenseActivity = rows.map((h) => {
        const exp = h.expense;
        return {
          bundle: 'activity',
          kind: 'expense',
          module: 'expense',
          ref: exp.expense_number,
          title: exp.title,
          status: `${h.action_type} ${mapStatus(exp.status)}`,
          amount: formatAmount(exp.estimated_amount ?? exp.final_amount),
          at: h.created_at ?? h.createdAt,
          actionType: h.action_type,
          fromRole: h.fromRole?.name,
          toRole: h.toRole?.name,
          link: `/expenses/${exp.uuid}`,
        };
      });
    }
  }

  // Procurement handovers — resolved per parent type for correct links.
  let procurementActivity = [];
  if (isProcGlobal || isProcManager) {
    const rows = await ProcurementHandover.findAll({
        where: { to_role_id: roleId },
        include: [
          { model: Role, as: 'fromRole', attributes: ['name'] },
          { model: Role, as: 'toRole', attributes: ['name'] },
        ],
        order: [['created_at', 'DESC']],
        limit: 30,
      });
      procurementActivity = await Promise.all(rows.map(async (h) => {
        const parent = await parseProcurementParent(h, companyIds);
        if (!parent) return null;
        if (companyIds.length && !companyIds.includes(parent.company_id)) return null;
        return {
          bundle: 'activity',
          kind: 'procurement',
          module: 'procurement',
          ref: parent.document_number,
          title: parent.title,
          status: `${h.action_type} ${mapStatus(parent.status)}`,
          amount: h.amount_at_step != null ? formatAmount(h.amount_at_step) : formatAmount(parent.grand_total),
          at: h.created_at ?? h.createdAt,
          actionType: h.action_type,
          fromRole: h.fromRole?.name,
          toRole: h.toRole?.name,
          link: `/procurement/${parent.uuid}`,
        };
      }));
      procurementActivity = (await procurementActivity).filter(Boolean);
  }

  return [...expenseActivity, ...procurementActivity];
};

// Resolve which procurement header a handover belongs to (pi_id / pr_id / po_id).
const parseProcurementParent = async (handover, companyIds) => {
  const { ProcurementIntention, ProcurementRequest, ProcurementOrder, Company } = db;
  for (const [model, col] of [
    [ProcurementIntention, 'pi_id'],
    [ProcurementRequest, 'pr_id'],
    [ProcurementOrder, 'po_id'],
  ]) {
    const id = handover[col];
    if (!id) continue;
    const parent = await model.findByPk(id, {
      include: [{ model: Company, as: 'company', attributes: ['id'] }],
    });
    if (parent) return parent;
  }
  return null;
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

// ── Public: merged dropdown feed (newest first) ──
export const getNotifications = async (user, params = {}) => {
  const role = await roleRepository.findByCode(user.roleCode);
  if (!role) return [];

  const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
  const type = params.type;
  const scope = params.scope;

  const slices = await Promise.all([
    getAssignedExpenseRows(user, role.id),
    getAssignedProcurementRows(user, role.id),
    getPaymentRows(user, role.id),
    getActivityRows(user, role.id),
  ]);
  const [assignedExpense, assignedProcurement, payments, activity] = slices;

  let feed = [...assignedExpense, ...assignedProcurement, ...payments, ...activity];
  if (type === 'assigned') feed = [...assignedExpense, ...assignedProcurement, ...payments];
  if (type === 'activity') feed = activity;
  if (scope === 'expense') feed = feed.filter((n) => n.module === 'expense');
  if (scope === 'procurement') feed = feed.filter((n) => n.module === 'procurement');

  feed.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  return feed.slice(0, limit);
};
