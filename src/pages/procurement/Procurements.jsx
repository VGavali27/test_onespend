import { useState, useEffect } from 'react';
import { formatDate, formatCurrency } from '@/utils/format';
import { Link, useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { ShoppingCart, Plus, Loader2, Eye, Inbox, FileText } from 'lucide-react';
import DataTablePage from '@/components/ui/DataTablePage';
import { procurementApiWithScope } from '@/services/procurementService';
import StatusBadge from '@/components/ui/StatusBadge';

const columnHelper = createColumnHelper();

const TYPES = ['PI', 'PR', 'PO'];
const STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PR_CREATED', 'QUOTATION_SELECTION', 'QUOTATION_APPROVED', 'CREATED', 'RECEIVED', 'FINANCE_APPROVED', 'PAID'];

// Workflow status colors (dark-mode aware). Mirrors the Profile page's
// EMPLOYMENT_STATUS_STYLES pattern: status → Tailwind pill classes.
const PROCUREMENT_STATUS_STYLES = {
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/20',
  CREATED: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/20',
  SUBMITTED: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-400/20',
  PR_CREATED: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  QUOTATION_SELECTION: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  QUOTATION_APPROVED: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  RECEIVED: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  FINANCE_APPROVED: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  APPROVED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-900/20 dark:text-indigo-400 dark:ring-indigo-400/20',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20',
  SELECTED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20',
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20',
  REJECTED: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/20',
};

function TypeBadge({ type }) {
  const palette = { PI: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400', PR: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', PO: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${palette[type] || palette.PI}`}>{type}</span>;
}

const TABS = [
  { id: 'all', label: 'All Requests', icon: Inbox, scope: 'all', description: 'All requests from your employments' },
  { id: 'mine', label: 'My Requests', icon: FileText, scope: 'mine', description: 'Only your own requests' },
  // Future: { id: 'role', label: 'Role-based', icon: Shield, scope: 'role', description: 'Filtered by role permissions' },
];

export default function Procurements() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const scope = searchParams.get('scope') || 'all';
    return TABS.find(t => t.scope === scope)?.id || 'all';
  });
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sync activeTab with URL scope param
  useEffect(() => {
    const scope = searchParams.get('scope') || 'all';
    const tab = TABS.find(t => t.scope === scope);
    if (tab && tab.id !== activeTab) {
      setActiveTab(tab.id);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    const tab = TABS.find(t => t.id === tabId);
    if (tab) {
      setActiveTab(tabId);
      setSearchParams({ ...Object.fromEntries(searchParams), scope: tab.scope });
    }
  };

  const columns = [
    columnHelper.accessor('document_number', {
      header: 'Document',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{row.original.document_number}</p>
          <p className="mt-0.5"><TypeBadge type={row.original.request_type} /></p>
        </div>
      ),
    }),
    columnHelper.accessor('title', {
      header: 'Title',
      cell: (info) => <p className="text-[13px] text-slate-600 dark:text-slate-300 truncate max-w-[220px]">{info.getValue() || '—'}</p>,
    }),
    columnHelper.accessor('vendor', {
      header: 'Vendor',
      cell: (info) => info.row.original.vendor?.name || '—',
    }),
    columnHelper.accessor('grand_total', {
      header: 'Grand total',
      enableSorting: false,
      cell: (info) => <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      enableSorting: false,
      cell: (info) => <StatusBadge status={info.getValue()} styles={PROCUREMENT_STATUS_STYLES} />,
    }),
    columnHelper.accessor('currentRole', {
      header: 'Current handler',
      enableSorting: false,
      cell: (info) => info.row.original.currentRole?.name || '—',
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
        return (
          <div className="flex items-center justify-end gap-1">
            <Link to={`/procurement/${row.original.uuid}`} title="View" className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              <Eye className="h-4 w-4" />
            </Link>
          </div>
        );
      },
    }),
  ];

  const currentScope = TABS.find(t => t.id === activeTab)?.scope || 'all';

  const fetchProcurements = async ({ page, limit, sortBy, sortOrder, search }, { signal }) => {
    const { data } = await procurementApiWithScope.list(
      { page, limit, sortBy, sortOrder, search, type: typeFilter, status: statusFilter, scope: currentScope },
      { signal },
    );
    return { data: data?.data ?? [], total: data?.meta?.total ?? 0 };
  };

  const filterSelect = (value, onChange, options, placeholder) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
    </select>
  );

  return (
    <>
      <DataTablePage
        title="Procurement"
        subtitle="PI → PR → PO → Received → Finance → CFO → Payment"
        icon={ShoppingCart}
        columns={columns}
        fetchFn={fetchProcurements}
        filterDeps={[typeFilter, statusFilter, activeTab]}
        countLabel="document"
        emptyMessage="No procurement documents yet"
        searchPlaceholder="Search by number, title or vendor..."
        actions={
          <>
            {filterSelect(typeFilter, setTypeFilter, TYPES, 'All types')}
            {filterSelect(statusFilter, setStatusFilter, STATUSES, 'All statuses')}
            <Link
              to="/procurement/new"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New PI
            </Link>
          </>
        }
        tabs={
          <div className="flex items-center border-b border-slate-200 dark:border-gray-700 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title={tab.description}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        }
      />
    </>
  );
}