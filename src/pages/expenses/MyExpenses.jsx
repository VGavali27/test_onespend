import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Wallet, Plus, Eye, Loader2, Calendar, X } from 'lucide-react';
import DataTablePage from '@/components/ui/DataTablePage';
import StatusBadge from '@/components/ui/StatusBadge';
import UserDetailsModal from '@/components/ui/UserDetailsModal';
import DatePicker from '@/components/ui/DatePicker';
import { useToast } from '@/components/ui/Toast';
import { getMyExpenses } from '@/services/expenseService';
import { getCategoryOptions } from '@/services/financeService';
import { approveExpense, rejectExpense, submitExpense, getHandoverRoles } from '@/services/expenseService';
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categories, setCategories] = useState([]);
  const [viewUser, setViewUser] = useState(null);
  const toast = useToast();

  // Check if date filter is active (both from and to must be set)
  const isDateFilterActive = dateFrom && dateTo;

  useEffect(() => {
    getCategoryOptions()
      .then(({ data }) => setCategories(data?.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  const hasFilters = statusFilter !== 'ALL' || categoryFilter !== 'ALL' || isDateFilterActive;
  const clearFilters = () => {
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const fetchExpenses = async ({ page, limit, sortBy, sortOrder, search }, { signal }) => {
    const { data } = await fetchList(
      {
        page,
        limit,
        search,
        status: statusFilter === 'ALL' ? '' : statusFilter,
        category: categoryFilter === 'ALL' ? '' : categoryFilter,
        dateFrom: isDateFilterActive ? dateFrom : '',
        dateTo: isDateFilterActive ? dateTo : '',
        dateField: 'submitted_at', // Always filter by submitted date
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
      cell: (info) => {
        const row = info.row.original;
        const approval =
          row.status === 'PAID' ? 'APPROVED' : row.status; // PAID is a payment state, never an approval status
        const payment = row.payment_status;
        const showPayment =
          payment &&
          // UNPAID is only meaningful once approved (awaiting payment); showing
          // it on a DRAFT/SUBMITTED row would be noise. All other payment
          // states (PAID/PARTIAL_PAID/SETTLED/...) always display.
          (payment !== 'UNPAID' || approval === 'APPROVED');
        return (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge status={approval} />
            {showPayment ? <StatusBadge status={payment} /> : null}
          </div>
        );
      },
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

        // Single view action for all modes
        const actions = [viewLink];
        
        return <div className="flex items-center justify-end gap-0.5">{actions}</div>;
      },
    }),
  ];

  // Subtitle based on actionMode
  const getSubtitle = () => {
    if (actionMode === 'assigned') return 'Expenses pending your approval';
    if (actionMode === 'payments') return 'Expenses awaiting payment processing';
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
        filterDeps={[statusFilter, categoryFilter, dateFrom, dateTo]}
        countLabel="expense"
        emptyMessage={actionMode === 'payments' ? 'No payment requests pending' : actionMode === 'assigned' ? 'No expenses pending your approval' : 'No expenses yet'}
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

            <div className="flex items-center gap-2">
              <div className="w-48">
                <DatePicker
                  value={dateFrom}
                  onChange={setDateFrom}
                  placeholder="From date"
                />
              </div>
              <span className="text-slate-400 px-1">to</span>
              <div className="w-48">
                <DatePicker
                  value={dateTo}
                  onChange={setDateTo}
                  placeholder="To date"
                />
              </div>
              {isDateFilterActive && (
                <button
                  type="button"
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Clear date range"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

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
