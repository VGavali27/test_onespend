import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { ReceiptText, X, Download } from 'lucide-react';
import DataTablePage from '@/components/ui/DataTablePage';
import DatePicker from '@/components/ui/DatePicker';
import { useToast } from '@/components/ui/Toast';
import { getExpenseNetSummary, exportExpenseNetSummary } from '@/services/reportsService';
import { getCategoryOptions } from '@/services/financeService';
import { getCompanyOptions } from '@/services/masterService';
import { formatCurrency, formatDate } from '@/utils/format';

const columnHelper = createColumnHelper();

const EXPENSE_STATUS_OPTIONS = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'COMPLETED'];

const selectClass =
  'px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer transition-colors';

export default function ExpenseNetReport() {
  const toast = useToast();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [expenseStatus, setExpenseStatus] = useState('ALL');

  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    getCategoryOptions()
      .then(({ data }) => setCategories(data?.data ?? []))
      .catch(() => setCategories([]));
    getCompanyOptions()
      .then(({ data }) => setCompanies(data?.data ?? []))
      .catch(() => setCompanies([]));
  }, []);

  const modules = useMemo(
    () => [...new Set(categories.map((c) => c?.module).filter(Boolean))].sort(),
    [categories],
  );

  const isDateFilterActive = dateFrom && dateTo;

  const filterQuery = useCallback(() => {
    const q = {
      dateFrom: isDateFilterActive ? dateFrom : '',
      dateTo: isDateFilterActive ? dateTo : '',
      module: moduleFilter === 'ALL' ? '' : moduleFilter,
      companyUuid: companyFilter === 'ALL' ? '' : companyFilter,
      expenseStatus: expenseStatus === 'ALL' ? '' : expenseStatus,
    };
    Object.keys(q).forEach((k) => !q[k] && delete q[k]);
    return q;
  }, [dateFrom, dateTo, isDateFilterActive, moduleFilter, companyFilter, expenseStatus]);

  const filterDeps = [dateFrom, dateTo, moduleFilter, companyFilter, expenseStatus];

  const hasFilters =
    isDateFilterActive ||
    moduleFilter !== 'ALL' ||
    companyFilter !== 'ALL' ||
    expenseStatus !== 'ALL';

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setModuleFilter('ALL');
    setCompanyFilter('ALL');
    setExpenseStatus('ALL');
  };

  const fetchExpenses = async ({ page, limit, sortBy, sortOrder, search }, { signal }) => {
    const params = { ...filterQuery(), page, limit, sortBy, sortOrder, search };
    const { data } = await getExpenseNetSummary(params, { signal });
    return { data: data?.data ?? [], total: data?.meta?.total ?? 0 };
  };

  const downloadCsv = async () => {
    try {
      const res = await exportExpenseNetSummary(filterQuery());
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-net-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Report exported — check your downloads');
    } catch {
      toast.error('Export failed — try again');
    }
  };

  const columns = [
    columnHelper.accessor('expense', {
      header: 'Expense',
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="min-w-0 space-y-0.5">
            <Link to={`/expenses/${r.expense_uuid}`} className="block min-w-0">
              <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate hover:text-indigo-600">
                {r.title || r.expense_number}
              </p>
            </Link>
            <div className="flex items-center gap-2">
              {r.module ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/20 capitalize">
                  {r.module}
                </span>
              ) : null}
              <p className="text-[12px] text-slate-400 truncate">{r.expense_number}</p>
            </div>
            {r.company_name ? <p className="text-[12px] text-slate-400 truncate">{r.company_name}</p> : null}
          </div>
        );
      },
    }),
    columnHelper.accessor('advance', {
      header: 'Advance',
      cell: (info) => (
        <div className="space-y-0.5">
          <p className="text-[13px] tabular-nums text-slate-700 dark:text-slate-300">{formatCurrency(info.getValue())}</p>
          {info.row.original.advance_date ? (
            <p className="text-[11px] text-slate-400 tabular-nums">{formatDate(info.row.original.advance_date)}</p>
          ) : null}
        </div>
      ),
    }),
    columnHelper.accessor('disbursed', {
      header: 'Paid out',
      cell: (info) => (
        <div className="space-y-0.5">
          <p className="text-[13px] tabular-nums text-slate-700 dark:text-slate-300">{formatCurrency(info.getValue())}</p>
          {info.row.original.disbursed_date ? (
            <p className="text-[11px] text-slate-400 tabular-nums">{formatDate(info.row.original.disbursed_date)}</p>
          ) : null}
        </div>
      ),
    }),
    columnHelper.accessor('refunded', {
      header: 'Refunded',
      cell: (info) => (
        <div className="space-y-0.5">
          <p className="text-[13px] tabular-nums text-slate-700 dark:text-slate-300">{formatCurrency(info.getValue())}</p>
          {info.row.original.refund_date ? (
            <p className="text-[11px] text-slate-400 tabular-nums">{formatDate(info.row.original.refund_date)}</p>
          ) : null}
        </div>
      ),
    }),
    columnHelper.accessor('net', {
      header: 'Net out',
      cell: (info) => {
        const net = Number(info.getValue()) || 0;
        return (
          <div className="space-y-0.5">
            <p className={`text-[13px] font-semibold tabular-nums ${net < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
              {formatCurrency(net)}
            </p>
            {info.row.original.last_date ? (
              <p className="text-[11px] text-slate-400 tabular-nums">{formatDate(info.row.original.last_date)}</p>
            ) : null}
          </div>
        );
      },
    }),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <DataTablePage
        title="Expense Net Summary"
        subtitle="Advance + payments − refunds for each expense (advance counts as company money paid out)"
        icon={ReceiptText}
        columns={columns}
        fetchFn={fetchExpenses}
        filterDeps={filterDeps}
        countLabel="expense"
        emptyMessage="No expenses found"
        searchPlaceholder="Search title or expense number..."
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        headerActions={
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
        actions={
          <>
            <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className={selectClass}>
              <option value="ALL">All modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>

            <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className={selectClass}>
              <option value="ALL">All companies</option>
              {companies.map((c) => (
                <option key={c.uuid} value={c.uuid}>
                  {c.name}
                </option>
              ))}
            </select>

            <select value={expenseStatus} onChange={(e) => setExpenseStatus(e.target.value)} className={selectClass}>
              <option value="ALL">All statuses</option>
              {EXPENSE_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.charAt(0) + st.slice(1).toLowerCase()}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <div className="w-44">
                <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From date" />
              </div>
              <span className="text-slate-400 px-1">to</span>
              <div className="w-44">
                <DatePicker value={dateTo} onChange={setDateTo} placeholder="To date" />
              </div>
              {isDateFilterActive && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Clear date range"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <X className="h-4 w-4" />
                Clear filters
              </button>
            )}
          </>
        }
      />
    </div>
  );
}
