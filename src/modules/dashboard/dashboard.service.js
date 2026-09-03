import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';
import { decrypt } from '../../utils/encryption.js';
import {
  getEmploymentIdsByUser,
  getActiveCompanyIdsByUser,
} from '../user_employment/user_employment.service.js';
import { EXPENSE_GLOBAL_ROLES, EXPENSE_MANAGER_ROLES } from '../expense/expense.service.js';

const { Expense, ExpenseCategory, ExpenseHandover, Role, UserEmployment, User, Sequelize } = db;
const { Op } = Sequelize;

// ── Period helpers ─────────────────────────────────────────────────────────────

// Resolve a period key into [start, end) plus the previous equivalent window
// (used for trend % change on the stat cards).
export const resolvePeriod = (period = 'this_month') => {
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  let start, end;

  switch (period) {
    case 'last_month': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
    case 'this_quarter': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qMonth, 1);
      end = new Date(now.getFullYear(), qMonth + 3, 1);
      break;
    }
    case 'this_year': {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    }
    default: // this_month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  // Previous window of the same length (for trend deltas)
  const spanMs = end - start;
  return {
    start,
    end,
    prevStart: new Date(start.getTime() - spanMs),
    prevEnd: new Date(start.getTime()),
  };
};

// ── Scope helpers ──────────────────────────────────────────────────────────────

// Visibility `where` for the logged-in user, mirroring the list endpoints:
// global roles see everything, managers see their companies, employees their own.
const buildScopeWhere = async (user) => {
  const isGlobal = EXPENSE_GLOBAL_ROLES.includes(user.roleCode);
  const isManager = EXPENSE_MANAGER_ROLES.includes(user.roleCode);

  if (isGlobal) return { isGlobal, isManager, where: {} };

  if (isManager) {
    const companyIds = await getActiveCompanyIdsByUser(user.userId);
    if (companyIds.length === 0) return { isGlobal, isManager, where: { id: { [Op.in]: [] } } };
    return { isGlobal, isManager, where: { company_id: { [Op.in]: companyIds } } };
  }

  const employmentIds = await getEmploymentIdsByUser(user.userId);
  if (employmentIds.length === 0) return { isGlobal, isManager, where: { id: { [Op.in]: [] } } };
  return {
    isGlobal,
    isManager,
    where: { requested_by_employment_id: { [Op.in]: employmentIds } },
  };
};

// ── Aggregation helpers ────────────────────────────────────────────────────────

// Sum/count helper over already-decrypted rows. Prefers final_amount, falls back
// to estimated_amount (drafts never have a final figure).
const summarize = (rows) => {
  let amount = 0;
  for (const r of rows) {
    // Handle encrypted amounts - decrypt returns original if not encrypted format
    const finalAmt = r.final_amount != null ? Number(decrypt(r.final_amount)) : null;
    const estAmt = r.estimated_amount != null ? Number(decrypt(r.estimated_amount)) : null;
    const v = (Number.isFinite(finalAmt) ? finalAmt : 0) + (Number.isFinite(estAmt) ? estAmt : 0);
    // For drafts, use estimated_amount; for others, use final_amount
    // But since we sum both, we avoid double-counting by prioritizing final
    const chosen = Number.isFinite(finalAmt) ? finalAmt : (Number.isFinite(estAmt) ? estAmt : 0);
    amount += chosen;
  }
  return { amount, count: rows.length };
};

// Trend % between current and previous windows (null when no previous data)
const trendPct = (current, previous) => {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

// Fetch light-weight expense rows (status + encrypted amounts + dates) for a scope
const fetchScopedExpenses = async (where) =>
  Expense.findAll({
    where,
    include: [{ model: ExpenseCategory, as: 'category', attributes: ['name', 'module'], required: false }],
    attributes: ['id', 'status', 'estimated_amount', 'final_amount', 'submitted_at', 'created_at'],
  });

// ── Main aggregator ────────────────────────────────────────────────────────────

export const getDashboard = async (user, query = {}) => {
  const period = resolvePeriod(query.period);
  const { isGlobal, isManager, where: scopeWhere } = await buildScopeWhere(user);
  const employmentIds = await getEmploymentIdsByUser(user.userId);
  const companyIds = await getActiveCompanyIdsByUser(user.userId);

  const inPeriod = { created_at: { [Op.gte]: period.start, [Op.lt]: period.end } };
  const inPrev = { created_at: { [Op.gte]: period.prevStart, [Op.lt]: period.start } };

  // ── Scoped rows for the selected period + previous ──
  const [rowsCurrent, rowsPrev, mineAllTime] = await Promise.all([
    fetchScopedExpenses({ ...scopeWhere, ...inPeriod }),
    fetchScopedExpenses({ ...scopeWhere, ...inPrev }),
    employmentIds.length
      ? fetchScopedExpenses({ requested_by_employment_id: { [Op.in]: employmentIds } })
      : Promise.resolve([]),
  ]);

  const byStatus = (rows, status) => rows.filter((r) => r.status === status);
  const activeMine = mineAllTime.filter((r) => r.status !== 'DRAFT');

  // Pending MY approval: routed to the user's role, still awaiting action
  let pendingMyApproval = { amount: 0, count: 0 };
  try {
    const role = await Role.findOne({ where: { code: user.roleCode }, attributes: ['id'] });
    if (role) {
      pendingMyApproval = summarize(await fetchScopedExpenses({ current_role_id: role.id, status: 'SUBMITTED', ...inPeriod }));
    }
  } catch (e) {
    logger.warn(`Failed to fetch pending approval: ${e.message}`);
  }

  const approvedCur = summarize(byStatus(rowsCurrent, 'APPROVED'));
  const approvedPrev = summarize(byStatus(rowsPrev, 'APPROVED'));
  const rejectedCur = summarize(byStatus(rowsCurrent, 'REJECTED'));
  const rejectedPrev = summarize(byStatus(rowsPrev, 'REJECTED'));

  // ── Raw metrics (frontend builds stat cards from these) ──
  const mySubmitted = summarize(activeMine.filter((r) => r.created_at >= period.start && r.created_at < period.end));
  const myPending = summarize(mineAllTime.filter((r) => ['SUBMITTED'].includes(r.status)));
  const pendingApproval = pendingMyApproval;
  const approved = { ...approvedCur, trend: trendPct(approvedCur.amount, approvedPrev.amount) };
  const rejected = { ...rejectedCur, trend: trendPct(rejectedCur.amount, rejectedPrev.amount) };

  // ── Spending trend: last 6 months (submitted amounts, visible scope) ──
  let spendingTrend = [];
  try {
    const trendRows = await fetchScopedExpenses({
      ...scopeWhere,
      status: { [Op.in]: ['SUBMITTED', 'APPROVED', 'PAID'] },
      created_at: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) },
    });
    const monthBuckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      monthBuckets.push({
        key: `${d.getFullYear()}-${d.getMonth() - i}`,
        label: new Date(d.getFullYear(), d.getMonth() - i, 1).toLocaleString('en-US', { month: 'short' }),
        amount: 0,
      });
    }
    for (const r of trendRows) {
      const d = new Date(r.submitted_at || r.created_at);
      const bucket = monthBuckets.find((b) => b.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (bucket) bucket.amount += Number(decrypt(r.final_amount ?? '') ?? 0) || Number(decrypt(r.estimated_amount ?? '') ?? 0) || 0;
    }
    spendingTrend = monthBuckets.map(({ label, amount }) => ({ label, amount }));
  } catch (e) {
    logger.warn(`Failed to fetch spending trend: ${e.message}`);
    spendingTrend = [];
  }

  // ── By category (selected period, visible scope) ──
  let spendingByCategory = [];
  try {
    const catMap = new Map();
    for (const r of rowsCurrent) {
      const name = r.category?.name || 'Uncategorized';
      const v = Number(decrypt(r.final_amount ?? '') ?? 0) || Number(decrypt(r.estimated_amount ?? '') ?? 0) || 0;
      catMap.set(name, (catMap.get(name) || 0) + v);
    }
    const grandTotal = [...catMap.values()].reduce((a, b) => a + b, 0);
    spendingByCategory = [...catMap.entries()]
      .map(([category, amount]) => ({
        category,
        amount,
        pct: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  } catch (e) {
    logger.warn(`Failed to fetch spending by category: ${e.message}`);
    spendingByCategory = [];
  }

  // ── Recent activity: latest handover actions on expenses in the user's scope ──
  let recentHandovers = [];
  try {
    const handoverWhere = {};
    if (!isGlobal) {
      if (companyIds.length === 0 && employmentIds.length === 0) handoverWhere.id = { [Op.in]: [] };
      else if (employmentIds.length > 0) {
        // Actions performed by me OR on my own expenses
        handoverWhere[Op.or] = [
          { action_by_employment_id: { [Op.in]: employmentIds } },
        ];
      }
    }
    recentHandovers = await ExpenseHandover.findAll({
      where: handoverWhere,
      include: [
        {
          model: Expense,
          as: 'expense',
          attributes: ['uuid', 'expense_number', 'title'],
          required: true,
        },
        { model: Role, as: 'fromRole', attributes: ['name'] },
        { model: UserEmployment, as: 'actionBy', include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] }] },
      ],
      order: [['created_at', 'DESC']],
      limit: 8,
    });
  } catch (e) {
    logger.warn(`Failed to fetch recent activity: ${e.message}`);
    recentHandovers = [];
  }

  const recentActivity = recentHandovers.map((h) => ({
    type: h.action_type,
    title: `${h.expense?.expense_number || ''} — ${h.expense?.title || ''}`,
    expense_uuid: h.expense?.uuid,
    remarks: h.remarks,
    from_role: h.fromRole?.name || null,
    actor: h.actionBy?.user
      ? [h.actionBy.user.first_name, h.actionBy.user.last_name].filter(Boolean).join(' ') || h.actionBy.user.email
      : null,
    time: h.created_at ?? h.createdAt,
  }));

  return {
    charts: {
      spendingTrend,
      spendingByCategory,
    },
    recentActivity,
    metrics: {
      mySubmitted,
      myPending,
      pendingApproval,
      approved,
      rejected,
      isManager,
      isGlobal,
    },
    roleContext: {
      isGlobal,
      canSeeTeamData: isGlobal || isManager,
      companyCount: isGlobal ? null : companyIds.length,
      period: query.period || 'this_month',
    },
  };
};