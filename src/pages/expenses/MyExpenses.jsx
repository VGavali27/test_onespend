import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Plus, Search, Table2, LayoutGrid, Eye } from 'lucide-react';
import { useMockExpenses } from '@/hooks/useMockExpenses';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatCurrency } from '@/utils/format';

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'amount-desc', label: 'Amount: high to low' },
  { value: 'amount-asc', label: 'Amount: low to high' },
  { value: 'title', label: 'Title A–Z' },
];

export default function MyExpenses() {
  const { expenses } = useMockExpenses();
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [sort, setSort] = useState('newest');

  const categories = useMemo(
    () => [...new Set(expenses.map((e) => e.category?.name).filter(Boolean))],
    [expenses]
  );

  const rows = useMemo(() => {
    let list = expenses;
    if (status !== 'ALL') list = list.filter((e) => e.status === status);
    if (category !== 'ALL') list = list.filter((e) => e.category?.name === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        [e.title, e.expense_number, e.company?.name].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return (a.submitted_at || a.id).localeCompare(b.submitted_at || b.id);
        case 'amount-desc':
          return (b.estimated_amount ?? 0) - (a.estimated_amount ?? 0);
        case 'amount-asc':
          return (a.estimated_amount ?? 0) - (b.estimated_amount ?? 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return (b.submitted_at || b.id).localeCompare(a.submitted_at || a.id);
      }
    });
  }, [expenses, status, category, search, sort]);

  const hasFilters = search.trim() !== '' || status !== 'ALL' || category !== 'ALL';
  const clearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setCategory('ALL');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Expenses</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{rows.length} expense{rows.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full sm:w-56 pl-9 pr-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Table / card toggle */}
          <div className="flex rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setView('table')}
              className={`px-2.5 py-2 transition-colors ${view === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800'}`}
              title="Table view"
            >
              <Table2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('cards')}
              className={`px-2.5 py-2 transition-colors ${view === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800'}`}
              title="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <Link
            to="/expenses/new"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Expense
          </Link>
        </div>
      </div>

      {/* Filters banner */}
      {hasFilters && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 text-[13px] text-indigo-700 dark:text-indigo-300">
          <span>Showing filtered results</span>
          <button onClick={clearFilters} className="font-semibold hover:underline">Clear filters</button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700">
          <Wallet className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No expenses found</p>
          <p className="text-[13px] text-slate-400 mt-1">
            {hasFilters ? 'Try adjusting your filters.' : 'Create your first expense to get started.'}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              Clear filters
            </button>
          )}
        </div>
      ) : view === 'table' ? (
        <ExpenseTable rows={rows} />
      ) : (
        <ExpenseCards rows={rows} />
      )}
    </div>
  );
}

function ExpenseTable({ rows }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr>
              {['Expense', 'Category', 'Company', 'Amount', 'Status', 'Submitted', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {rows.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-gray-800/50">
                <td className="px-5 py-3.5 border-b border-slate-100 dark:border-gray-800">
                  <Link to={`/expenses/${row.id}`} className="block min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate hover:text-indigo-600">{row.title}</p>
                    <p className="text-[12px] text-slate-400">{row.expense_number}</p>
                  </Link>
                </td>
                <td className="px-5 py-3.5 border-b border-slate-100 dark:border-gray-800">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/20">
                    {row.category?.name || '—'}
                  </span>
                </td>
                <td className="px-5 py-3.5 border-b border-slate-100 dark:border-gray-800 text-[12px] text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
                  {row.company?.name || '—'}
                </td>
                <td className="px-5 py-3.5 border-b border-slate-100 dark:border-gray-800 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                  {formatCurrency(row.estimated_amount)}
                </td>
                <td className="px-5 py-3.5 border-b border-slate-100 dark:border-gray-800">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-5 py-3.5 border-b border-slate-100 dark:border-gray-800 text-[12px] text-slate-500 dark:text-slate-400">
                  {row.submitted_at ? formatDate(row.submitted_at) : 'Draft'}
                </td>
                <td className="px-5 py-3.5 border-b border-slate-100 dark:border-gray-800">
                  <Link to={`/expenses/${row.id}`} title="View expense" className="inline-flex p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                    <Eye className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpenseCards({ rows }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {rows.map((row) => (
        <Link
          key={row.id}
          to={`/expenses/${row.id}`}
          className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{row.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{row.expense_number}</p>
            </div>
            <StatusBadge status={row.status} />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(row.estimated_amount)}</p>
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/20">
              {row.category?.name || '—'}
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              {row.company?.name || '—'} · {row.submitted_at ? formatDate(row.submitted_at) : 'Draft'}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
