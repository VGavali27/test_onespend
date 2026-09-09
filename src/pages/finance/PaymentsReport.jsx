import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { BarChart3, Download, X, Paperclip, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import DataTablePage from '@/components/ui/DataTablePage';
import DatePicker from '@/components/ui/DatePicker';
import { useToast } from '@/components/ui/Toast';
import { getPaymentReport, getPaymentReportSummary, exportPaymentsReport } from '@/services/reportsService';
import { getCategoryOptions } from '@/services/financeService';
import { getCompanyOptions } from '@/services/masterService';
import { formatCurrency, formatDate, formatType } from '@/utils/format';

const columnHelper = createColumnHelper();

// payment_type direction: disbursements flow company → user/vendor;
// the rest (ADVANCE_REFUND / REFUND_RECEIVED) are refunds user → company.
// ADVANCE is a synthetic row added by the backend for reimbursement advances.
const DISBURSEMENT_TYPES = ['PARTIAL', 'FULL', 'ADDITIONAL', 'ADVANCE'];

const PAYMENT_METHOD_OPTIONS = ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE'];
const PAYMENT_TYPE_OPTIONS = ['PARTIAL', 'FULL', 'ADDITIONAL', 'ADVANCE_REFUND', 'REFUND_RECEIVED'];
const EXPENSE_STATUS_OPTIONS = ['SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'COMPLETED'];
const PAYMENT_STATUS_OPTIONS = ['UNPAID', 'PAID', 'PARTIAL_PAID', 'ADVANCE_REFUND_DUE', 'ADDITIONAL_PAYMENT_DUE', 'SETTLED'];

const selectClass =
  'px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer transition-colors';

export default function PaymentsReport() {
  const toast = useToast();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [expenseStatus, setExpenseStatus] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');

  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [summary, setSummary] = useState(null);

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

  // Active filter query (shared by the table fetch, the summary cards and the export).
  const filterQuery = useCallback(() => {
    const q = {
      dateFrom: isDateFilterActive ? dateFrom : '',
      dateTo: isDateFilterActive ? dateTo : '',
      module: moduleFilter === 'ALL' ? '' : moduleFilter,
      companyUuid: companyFilter === 'ALL' ? '' : companyFilter,
      paymentMethod: methodFilter === 'ALL' ? '' : methodFilter,
      paymentType: typeFilter === 'ALL' ? '' : typeFilter,
      expenseStatus: expenseStatus === 'ALL' ? '' : expenseStatus,
      paymentStatus: paymentStatus === 'ALL' ? '' : paymentStatus,
    };
    Object.keys(q).forEach((k) => !q[k] && delete q[k]);
    return q;
  }, [dateFrom, dateTo, isDateFilterActive, moduleFilter, companyFilter, methodFilter, typeFilter, expenseStatus, paymentStatus]);

  const filterDeps = [dateFrom, dateTo, moduleFilter, companyFilter, methodFilter, typeFilter, expenseStatus, paymentStatus];

  const hasFilters =
    isDateFilterActive ||
    moduleFilter !== 'ALL' ||
    companyFilter !== 'ALL' ||
    methodFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    expenseStatus !== 'ALL' ||
    paymentStatus !== 'ALL';

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setModuleFilter('ALL');
    setCompanyFilter('ALL');
    setMethodFilter('ALL');
    setTypeFilter('ALL');
    setExpenseStatus('ALL');
    setPaymentStatus('ALL');
  };

  const filterKey = JSON.stringify(filterDeps);
  useEffect(() => {
    const t = setTimeout(() => {
      getPaymentReportSummary(filterQuery())
        .then(({ data }) => setSummary(data?.data ?? null))
        .catch(() => setSummary(null));
    }, 300);
    return () => clearTimeout(t);
  }, [filterKey]);

  const fetchPayments = async ({ page, limit, sortBy, sortOrder, search }, { signal }) => {
    const params = { ...filterQuery(), page, limit, search, sortBy, sortOrder };
    const { data } = await getPaymentReport(params, { signal });
    return { data: data?.data ?? [], total: data?.meta?.total ?? 0 };
  };

  const downloadCsv = async () => {
    try {
      const res = await exportPaymentsReport(filterQuery());
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-report-${new Date().toISOString().slice(0, 10)}.csv`;
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
        const e = row.original.expense;
        if (!e) return <span className="text-slate-400">—</span>;
        return (
          <div className="min-w-0 space-y-0.5">
            <Link to={`/expenses/${e.uuid}`} className="block min-w-0">
              <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate hover:text-indigo-600">
                {e.title}
              </p>
            </Link>
            <div className="flex items-center gap-2">
              {e.module ? <ModulePill label={e.module} /> : null}
              <p className="text-[12px] text-slate-400 truncate">{e.expense_number}</p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('company', {
      header: 'Company / Vendor',
      enableSorting: false,
      cell: (info) => {
        const r = info.row.original;
        const c = r.company;
        const v = r.vendor;
        if (!c && !v) return <span className="text-slate-400">—</span>;
        return (
          <div className="min-w-0 space-y-1">
            {c && (
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate">{c.name}</p>
                {c.gst_number ? <p className="text-[12px] text-slate-400 truncate">GST: {c.gst_number}</p> : null}
              </div>
            )}
            {v && (
              <div className="min-w-0 pt-1 border-t border-dashed border-slate-200 dark:border-gray-700">
                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate">{v.name}</p>
                {v.gst_number ? <p className="text-[12px] text-slate-400 truncate">GST: {v.gst_number}</p> : null}
              </div>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('payment_date', {
      header: 'Payment',
      cell: (info) => {
        const r = info.row.original;
        return (
          <div className="min-w-0 space-y-0.5">
            <p className="text-[13px] text-slate-700 dark:text-slate-300 tabular-nums">{formatDate(r.payment_date)}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <PaymentTypePill type={r.payment_type} />
              {r.payment_method ? (
                <span className="text-[11px] text-slate-500">{formatType(r.payment_method)}</span>
              ) : null}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: (info) => {
        const r = info.row.original;
        return (
          <div className="space-y-0.5">
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(r.amount)}
            </p>
            {Number(r.proof_count) > 0 && (
              <p className="inline-flex items-center gap-1 text-[11px] text-slate-400 tabular-nums">
                <Paperclip className="h-3 w-3" />
                {r.proof_count} proof{r.proof_count === 1 ? '' : 's'}
              </p>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('reference_number', {
      header: 'Reference',
      cell: (info) =>
        info.getValue() ? (
          <span className="text-[13px] text-slate-600 dark:text-slate-300">{info.getValue()}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    }),
    columnHelper.accessor('processed_by', {
      header: 'Processed by',
      enableSorting: false,
      cell: (info) =>
        info.getValue() ? (
          <span className="text-[13px] text-slate-600 dark:text-slate-300">{info.getValue()}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    }),
  ];

  const s = summary ?? {};

  return (
    <div className="space-y-6 animate-fade-in">
      <DataTablePage
        title="Payments Report"
        subtitle="All expense payments for finance & CA (ledger, totals and CSV export)"
        icon={BarChart3}
        columns={columns}
        fetchFn={fetchPayments}
        filterDeps={filterDeps}
        countLabel="payment"
        emptyMessage="No payments recorded yet"
        searchPlaceholder="Search title, expense number or reference..."
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
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

            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className={selectClass}>
              <option value="ALL">All methods</option>
              {PAYMENT_METHOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {formatType(m)}
                </option>
              ))}
            </select>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
              <option value="ALL">All types</option>
              {PAYMENT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatType(t)}
                </option>
              ))}
            </select>

            <select value={expenseStatus} onChange={(e) => setExpenseStatus(e.target.value)} className={selectClass}>
              <option value="ALL">All expense statuses</option>
              {EXPENSE_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.charAt(0) + st.slice(1).toLowerCase()}
                </option>
              ))}
            </select>

            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={selectClass}>
              <option value="ALL">All payment statuses</option>
              {PAYMENT_STATUS_OPTIONS.map((st) => (
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

            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </>
        }
      />

      <ReportSummary summary={s} />
    </div>
  );
}

// ── Summary section: totals + breakout panels ──
function ReportSummary({ summary }) {
  const { total_disbursed = 0, total_refunds = 0, net_paid = 0, payment_count = 0, outstanding } = summary;

  const statCards = [
    { label: 'Total disbursed', value: formatCurrency(total_disbursed), tone: 'indigo', icon: ArrowUpRight },
    { label: 'Refunds received', value: formatCurrency(total_refunds), tone: 'emerald', icon: ArrowDownLeft },
    { label: 'Net paid out', value: formatCurrency(net_paid), tone: 'slate', icon: BarChart3 },
    { label: 'Payments recorded', value: String(payment_count), tone: 'slate', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const toneClass =
            card.tone === 'indigo'
              ? 'bg-indigo-600 text-white shadow-indigo-600/25'
              : card.tone === 'emerald'
                ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                : 'bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700';
          return (
            <div key={card.label} className={`rounded-xl p-4 flex items-center justify-between shadow-sm ${toneClass}`}>
              <div>
                <p className={`text-[12px] font-medium ${card.tone === 'slate' ? 'text-slate-400 dark:text-slate-500' : 'text-white/80'}`}>
                  {card.label}
                </p>
                <p className={`mt-1 text-xl font-bold tabular-nums ${card.tone === 'slate' ? 'text-slate-900 dark:text-white' : 'text-white'}`}>
                  {card.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  card.tone === 'slate'
                    ? 'bg-slate-100 dark:bg-gray-800 text-slate-500'
                    : 'bg-white/15 text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      <OutstandingCard outstanding={outstanding} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BreakoutPanel title="By module" rows={(summary.by_module ?? []).map((r) => ({ label: r.module, count: r.count, disbursed: r.disbursed, refunds: r.refunds }))} />
        <BreakoutPanel title="By month" rows={(summary.by_month ?? []).map((r) => ({ label: r.month, count: r.count, disbursed: r.disbursed, refunds: r.refunds }))} />
        <BreakoutPanel title="By company" rows={(summary.by_company ?? []).map((r) => ({ label: r.company_name, count: r.count, disbursed: r.disbursed, refunds: r.refunds, sub: r.gst_number }))} />
        <OverviewTally rows={[summary.total_disbursed, summary.total_refunds, summary.net_paid]} />
      </div>
    </div>
  );
}

function OutstandingCard({ outstanding }) {
  const o = outstanding ?? { count: 0, amount_due: 0 };
  if (o.count === 0 && !(o.amount_due > 0)) {
    return (
      <div className="rounded-xl p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-200">
        <p className="font-semibold">Outstanding</p>
        <p>No approved expenses are awaiting payment in this scope.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[12px] font-medium text-amber-600 dark:text-amber-300">Outstanding (approved, not yet settled)</p>
          <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-200 tabular-nums">
            {formatCurrency(o.amount_due)}
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold text-amber-700 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40">
          {o.count} expense{o.count === 1 ? '' : 's'} awaiting payment
        </span>
      </div>
    </div>
  );
}

function BreakoutPanel({ title, rows }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <h3 className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-[13px] text-slate-400">No data</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 text-[13px]">
              <div className="min-w-0">
                <p className="font-medium text-slate-700 dark:text-slate-300 truncate capitalize">{r.label}</p>
                {r.sub ? <p className="text-[12px] text-slate-400 truncate">{r.sub}</p> : null}
              </div>
              <div className="text-right shrink-0 tabular-nums">
                <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(r.disbursed)}</p>
                <p className="text-[12px] text-slate-400">
                  {r.count} payment{r.count === 1 ? '' : 's'}
                  {r.refunds > 0 ? ` · refund ${formatCurrency(r.refunds)}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Right-hand card that simply restates the headline totals (space filler + at-a-glance).
function OverviewTally({ rows }) {
  return (
    <div>
      <TableCard
        title="Overview"
        rows={[
          ['Total disbursed', rows[0]],
          ['Refunds received', rows[1]],
          ['Net paid out', rows[2]],
        ]}
      />
    </div>
  );
}

function TableCard({ title, rows }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <h3 className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-3">{title}</h3>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-[13px]">
            <p className="text-slate-500 dark:text-slate-400">{label}</p>
            <p className="font-semibold text-slate-900 dark:text-white tabular-nums">{formatCurrency(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModulePill({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/20 capitalize">
      {label}
    </span>
  );
}

function PaymentTypePill({ type }) {
  const refund = !DISBURSEMENT_TYPES.includes(type);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        refund
          ? 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/20'
          : 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/20'
      }`}
    >
      {type ? formatType(type) : '—'}
    </span>
  );
}