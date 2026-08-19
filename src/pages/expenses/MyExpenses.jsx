import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Wallet, Plus, Eye, Pencil, Send, CheckCircle2, XCircle, ArrowRightLeft, Banknote, Loader2 } from 'lucide-react';
import DataTablePage from '@/components/ui/DataTablePage';
import StatusBadge from '@/components/ui/StatusBadge';
import UserDetailsModal from '@/components/ui/UserDetailsModal';
import { useToast } from '@/components/ui/Toast';
import { getMyExpenses } from '@/services/expenseService';
import { categoryApi } from '@/services/financeService';
import { approveExpense, rejectExpense, getHandoverRoles } from '@/services/expenseService';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { useAuth } from '@/context/AuthContext';

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID'];
const columnHelper = createColumnHelper();

// Shared expense list built on the standard DataTablePage (server-side pagination,
// sorting, debounced search, filters). Rendered by both /expenses/my (own expenses)
// and /expenses/all (the role+company-scoped list) and /expenses/assigned (pending approval)
// via the fetchList prop and actionMode.
export default function MyExpenses({ title = 'My Expenses', fetchList = getMyExpenses, actionMode = 'mine' }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [categories, setCategories] = useState([]);
  const [viewUser, setViewUser] = useState(null);
  const [acting, setActing] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject'
  const [remarks, setRemarks] = useState('');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [handoverRoles, setHandoverRoles] = useState([]);
  const [selectedHandoverRoleId, setSelectedHandoverRoleId] = useState(null);
  const [loadingHandoverRoles, setLoadingHandoverRoles] = useState(false);
  const toast = useToast();
  const { user } = useAuth();

  // Approve/handover/payment endpoints aren't built yet — show a notice until they are.
  const placeholderAction = () => toast.error('This action is not implemented yet.');

  useEffect(() => {
    categoryApi
      .list({ limit: 100 })
      .then(({ data }) => setCategories(data?.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  const hasFilters = statusFilter !== 'ALL' || categoryFilter !== 'ALL';
  const clearFilters = () => {
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
  };

  const fetchExpenses = async ({ page, limit, sortBy, sortOrder, search }, { signal }) => {
    const { data } = await fetchList(
      {
        page,
        limit,
        search,
        status: statusFilter === 'ALL' ? '' : statusFilter,
        category: categoryFilter === 'ALL' ? '' : categoryFilter,
        sortBy,
        sortOrder,
      },
      { signal }
    );
    return { data: data?.data ?? [], total: data?.meta?.total ?? 0 };
  };

  const loadHandoverRoles = useCallback(async (expenseId) => {
    setLoadingHandoverRoles(true);
    try {
      const { data } = await getHandoverRoles(expenseId);
      setHandoverRoles(data?.data ?? []);
    } catch (e) {
      console.error('Failed to load handover roles:', e);
      setHandoverRoles([]);
    } finally {
      setLoadingHandoverRoles(false);
    }
  }, []);

  const handleApproveClick = useCallback(async (expense) => {
    setSelectedExpense(expense);
    await loadHandoverRoles(expense.uuid);
    setConfirmAction('approve');
  }, [loadHandoverRoles]);

  const runAction = useCallback(async (key, actionRemarks) => {
    if (!selectedExpense) return;
    setActing(true);
    try {
      if (key === 'approve') await approveExpense(selectedExpense.uuid, actionRemarks, selectedHandoverRoleId);
      else if (key === 'reject') await rejectExpense(selectedExpense.uuid, actionRemarks);
      toast.success(key === 'approve' ? 'Expense approved' : 'Expense rejected');
      setConfirmAction(null);
      setRemarks('');
      setSelectedExpense(null);
      setSelectedHandoverRoleId(null);
      setHandoverRoles([]);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Action failed.');
    } finally {
      setActing(false);
    }
  }, [selectedExpense, selectedHandoverRoleId, toast]);

  const columns = [
    columnHelper.accessor('title', {
      header: 'Expense',
      cell: ({ row }) => (
        <Link to={`/expenses/${row.original.uuid}`} className="block min-w-0">
          <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate hover:text-indigo-600">
            {row.original.title}
          </p>
          <p className="text-[12px] text-slate-400">{row.original.expense_number}</p>
        </Link>
      ),
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      enableSorting: false,
      cell: (info) => {
        const name = info.getValue()?.name;
        return name ? <CategoryPill name={name} /> : '—';
      },
    }),
    // All Expenses: one column with the submitter's name (clickable → user modal) on top
    // and the company below. My Expenses just shows the company.
    // Assigned: show submitter name + company
    columnHelper.accessor('company', {
      header: actionMode === 'all' || actionMode === 'assigned' ? 'Submitted by' : 'Company',
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        const companyName = r.company?.name || '—';
        if (actionMode !== 'all' && actionMode !== 'assigned') return companyName;
        const emp = r.requestedByEmployment;
        const u = emp?.user;
        const name = u ? [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email : null;
        return (
          <div className="min-w-0">
            {name ? (
              <button
                type="button"
                onClick={() => setViewUser(emp)}
                className="block max-w-full truncate text-[13px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                title="View user details"
              >
                {name}
              </button>
            ) : (
              <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200">—</p>
            )}
            <p className="text-[12px] text-slate-400 truncate">{companyName}</p>
          </div>
        );
      },
    }),
    columnHelper.accessor('estimated_amount', {
      header: 'Amount',
      enableSorting: false, // stored encrypted in the DB — can't sort numerically server-side
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      enableSorting: false,
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('submitted_at', {
      header: 'Submitted',
      cell: (info) => (info.getValue() ? formatDateTime(info.getValue()) : '-'),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.accessor('updatedAt', {
      header: 'Updated',
      enableSorting: false,
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="block text-right">Actions</span>,
      cell: ({ row }) => {
        const r = row.original;
        const iconClass = 'p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors';
        const viewLink = (
          <Link key="view" to={`/expenses/${r.uuid}`} title="View expense" className={iconClass}>
            <Eye className="h-4 w-4" />
          </Link>
        );

        let actions;
        if (actionMode === 'all') {
          // Approver / senior view — approve, reject, handover, payment (placeholders)
          actions = [
            <button key="approve" type="button" title="Approve" onClick={placeholderAction} className={`${iconClass} hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20`}>
              <CheckCircle2 className="h-4 w-4" />
            </button>,
            <button key="reject" type="button" title="Reject" onClick={placeholderAction} className={`${iconClass} hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20`}>
              <XCircle className="h-4 w-4" />
            </button>,
            <button key="handover" type="button" title="Handover" onClick={placeholderAction} className={iconClass}>
              <ArrowRightLeft className="h-4 w-4" />
            </button>,
            <button key="pay" type="button" title="Process payment" onClick={placeholderAction} className={`${iconClass} hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20`}>
              <Banknote className="h-4 w-4" />
            </button>,
            viewLink,
          ];
        } else if (actionMode === 'assigned') {
          // Assigned view — approve/reject for SUBMITTED expenses where user is the handler
          // Check if the current user's role matches the current handler role
          const isCurrentHandler = r.currentRole?.code && user?.role === r.currentRole.code;
          const isSubmitted = r.status === 'SUBMITTED';
          const canAct = isCurrentHandler || user?.role === 'SUPER_ADMIN';

          actions = [
            canAct && isSubmitted && (
              <button
                key="approve"
                type="button"
                title="Approve expense"
                disabled={acting}
                onClick={() => handleApproveClick(r)}
                className={`${iconClass} hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20`}
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
            ),
            canAct && isSubmitted && (
              <button
                key="reject"
                type="button"
                title="Reject expense"
                disabled={acting}
                onClick={() => { setSelectedExpense(r); setConfirmAction('reject'); }}
                className={`${iconClass} hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20`}
              >
                <XCircle className="h-4 w-4" />
              </button>
            ),
            viewLink,
          ];
        } else {
          // Creator's own view — edit + submit while DRAFT
          actions = [
            r.canEdit && (
              <Link key="edit" to={`/expenses/${r.uuid}/edit`} title="Edit expense" className={iconClass}>
                <Pencil className="h-4 w-4" />
              </Link>
            ),
            r.canEdit && (
              <button key="submit" type="button" title="Submit expense" onClick={placeholderAction} className={`${iconClass} hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20`}>
                <Send className="h-4 w-4" />
              </button>
            ),
            viewLink,
          ];
        }
        return <div className="flex items-center justify-end gap-0.5">{actions.filter(Boolean)}</div>;
      },
    }),
  ];

  // Subtitle based on actionMode
  const getSubtitle = () => {
    if (actionMode === 'assigned') return 'Expenses pending your approval';
    if (title === 'All Expenses') return 'Expenses across your companies';
    return 'Expenses you have created';
  };

  return (
    <>
      <DataTablePage
        title={title}
        subtitle={getSubtitle()}
        icon={Wallet}
        columns={columns}
        fetchFn={fetchExpenses}
        filterDeps={[statusFilter, categoryFilter]}
        countLabel="expense"
        emptyMessage={actionMode === 'assigned' ? 'No expenses pending your approval' : 'No expenses yet'}
        searchPlaceholder="Search by title, number or company..."
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        actions={
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer transition-colors"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All statuses' : s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer transition-colors"
            >
              <option value="ALL">All categories</option>
              {categories.map((c) => (
                <option key={c.uuid} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <Link
              to="/expenses/new"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Expense
            </Link>
          </>
        }
      />

      <UserDetailsModal employment={viewUser} onClose={() => setViewUser(null)} />

      {/* Confirm approve/reject with optional remark and handover role selection */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => { setConfirmAction(null); setSelectedExpense(null); setSelectedHandoverRoleId(null); }}>
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {confirmAction === 'approve' ? 'Approve expense' : 'Reject expense'}
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              {confirmAction === 'approve'
                ? 'Forward to the next approver (or close as approved at the final approver).'
                : 'Mark this expense as rejected and clear the current handler.'}
            </p>
            {confirmAction === 'approve' && handoverRoles.length > 0 && (
              <div className="space-y-1">
                <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300">Handover to role <span className="text-red-500">*</span></label>
                <select
                  value={selectedHandoverRoleId || ''}
                  onChange={(e) => setSelectedHandoverRoleId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer transition-colors"
                  required
                >
                  <option value="">Select handover role</option>
                  {handoverRoles.map((role) => (
                    <option key={role.roleId} value={role.roleId}>
                      {role.roleName} ({role.roleCode})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Choose who to forward this expense to. Valid handovers are configured in Role Handover Rules.</p>
              </div>
            )}
            {confirmAction === 'approve' && handoverRoles.length === 0 && !loadingHandoverRoles && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">No valid handover roles configured. Expense will be sent to the final approver.</p>
            )}
            {confirmAction === 'approve' && loadingHandoverRoles && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                <span className="ml-2 text-[12px] text-slate-400">Loading handover roles...</span>
              </div>
            )}
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Remarks (optional)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setConfirmAction(null); setSelectedExpense(null); setSelectedHandoverRoleId(null); }}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={acting || (confirmAction === 'approve' && handoverRoles.length > 0 && !selectedHandoverRoleId)}
                onClick={() => runAction(confirmAction, remarks)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-60 transition-colors ${confirmAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {acting && <Loader2 className="h-4 w-4 animate-spin" />}
                {acting ? 'Working...' : confirmAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CategoryPill({ name }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/20">
      {name}
    </span>
  );
}
