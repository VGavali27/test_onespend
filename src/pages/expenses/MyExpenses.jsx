import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Wallet, Plus, Eye, Pencil, Send, CheckCircle2, XCircle, ArrowRightLeft, Banknote } from 'lucide-react';
import DataTablePage from '@/components/ui/DataTablePage';
import StatusBadge from '@/components/ui/StatusBadge';
import UserDetailsModal from '@/components/ui/UserDetailsModal';
import { useToast } from '@/components/ui/Toast';
import { getMyExpenses } from '@/services/expenseService';
import { categoryApi } from '@/services/financeService';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID'];
const columnHelper = createColumnHelper();

// Shared expense list built on the standard DataTablePage (server-side pagination,
// sorting, debounced search, filters). Rendered by both /expenses/my (own expenses)
// and /expenses/all (the role+company-scoped list) via the fetchList prop.
export default function MyExpenses({ title = 'My Expenses', fetchList = getMyExpenses, actionMode = 'mine' }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [categories, setCategories] = useState([]);
  const [viewUser, setViewUser] = useState(null);
  const toast = useToast();

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
    columnHelper.accessor('company', {
      header: actionMode === 'all' ? 'Submitted by' : 'Company',
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        const companyName = r.company?.name || '—';
        if (actionMode !== 'all') return companyName;
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

  return (
    <>
      <DataTablePage
        title={title}
        subtitle={title === 'All Expenses' ? 'Expenses across your companies' : 'Expenses you have created'}
        icon={Wallet}
        columns={columns}
        fetchFn={fetchExpenses}
        filterDeps={[statusFilter, categoryFilter]}
        countLabel="expense"
        emptyMessage="No expenses yet"
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
