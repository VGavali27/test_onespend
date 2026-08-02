import { useEffect, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import {
  Users as UsersIcon,
  Plus,
  Search,
  RotateCw,
  UserX,
  Inbox,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import { getUsers } from '@/services/masterService';

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20',
  INACTIVE: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  BLOCKED: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/20',
};

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE', 'BLOCKED'];
const PAGE_SIZES = [10, 25, 50];

// Frontend accessor id → backend sortable attribute name
const SORT_FIELD_MAP = { created_at: 'createdAt', first_name: 'first_name' };

const getFullName = (u) => [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ') || '—';

const getInitials = (u) =>
  ((u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')).toUpperCase() || '?';

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

// Compact page list with ellipsis for large page counts, e.g. [1, 2, '…', 8, 9, 10]
function getPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const candidates = [1, 2, current - 1, current, current + 1, total - 1, total]
    .filter((p) => p >= 1 && p <= total);
  const sorted = [...new Set(candidates)].sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor('first_name', {
    header: 'User',
    cell: ({ row }) => <UserCell user={row.original} />,
  }),
  columnHelper.accessor('mobile', {
    header: 'Mobile',
    cell: (info) => info.getValue() || '—',
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor('created_at', {
    header: 'Created',
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.display({
    id: 'actions',
    header: () => <span className="block text-right">Actions</span>,
    cell: () => (
      <div className="flex items-center justify-end gap-1">
        <IconButton title="View user" icon={Eye} />
        <IconButton title="Edit user" icon={Pencil} />
        <IconButton title="Delete user" icon={Trash2} danger />
      </div>
    ),
  }),
];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sorting, setSorting] = useState([{ id: 'created_at', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Debounce the search input before hitting the API
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to first page whenever a filter or sort changes
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [debouncedSearch, statusFilter, sorting]);

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    manualPagination: true,
    manualSorting: true,
    rowCount: total,
    getCoreRowModel: getCoreRowModel(),
  });

  // Fetch the current page from the server
  useEffect(() => {
    const controller = new AbortController();
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getUsers(
          {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            search: debouncedSearch,
            status: statusFilter === 'ALL' ? '' : statusFilter,
            sortBy: SORT_FIELD_MAP[sorting[0]?.id] ?? sorting[0]?.id,
            sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
          },
          { signal: controller.signal }
        );
        setUsers(data?.data ?? []);
        setTotal(data?.meta?.total ?? 0);
      } catch (err) {
        if (err?.code !== 'ERR_CANCELED') {
          setError(err?.response?.data?.message || 'Failed to load users. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
    return () => controller.abort();
  }, [pagination, debouncedSearch, statusFilter, sorting, reloadKey]);

  const { pageIndex, pageSize } = pagination;
  const pageCount = table.getPageCount();
  const pageList = getPageList(pageIndex + 1, pageCount);
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);
  const hasFilters = debouncedSearch.trim() !== '' || statusFilter !== 'ALL';
  const initialLoading = loading && users.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <UsersIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Users</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Manage users and their access</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email or mobile..."
              className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
            />
          </div>
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
          <button className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors">
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
        {initialLoading ? (
          <SkeletonRows />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : users.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onClear={() => {
              setSearchInput('');
              setStatusFilter('ALL');
            }}
          />
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-gray-700">
              <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
                {total} user{total === 1 ? '' : 's'}
              </p>
              {loading && (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating...
                </span>
              )}
            </div>

            <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full text-left">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className="border-b border-slate-200 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-800/50"
                    >
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={
                                header.column.getCanSort()
                                  ? 'inline-flex items-center gap-1 cursor-pointer select-none hover:text-slate-600 dark:hover:text-slate-200 transition-colors'
                                  : ''
                              }
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && <SortIcon direction={header.column.getIsSorted()} />}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="group hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-3.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-800/50">
              <div className="flex items-center gap-4">
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  Showing <span className="font-medium text-slate-700 dark:text-slate-200">{from}</span>–<span className="font-medium text-slate-700 dark:text-slate-200">{to}</span>
                  {' of '}
                  <span className="font-medium text-slate-700 dark:text-slate-200">{total}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-slate-400">Rows</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPagination((p) => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
                    className="px-2 py-1 rounded-md text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none cursor-pointer"
                  >
                    {PAGE_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <PageButton onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} title="First page" icon={ChevronsLeft} />
                <PageButton onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} title="Previous page" icon={ChevronLeft} />
                {pageList.map((p, i) =>
                  p === '…' ? (
                    <span key={`e-${i}`} className="px-1.5 text-[12px] text-slate-400 select-none">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => table.setPageIndex(p - 1)}
                      className={`min-w-8 h-8 px-2 rounded-md text-[12px] font-semibold transition-colors ${
                        p === pageIndex + 1
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <PageButton onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} title="Next page" icon={ChevronRight} />
                <PageButton onClick={() => table.setPageIndex(pageCount - 1)} disabled={!table.getCanNextPage()} title="Last page" icon={ChevronsRight} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Presentational helpers (keep in this file until reused) ──

function UserCell({ user }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {getInitials(user)}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{getFullName(user)}</p>
        <p className="text-[12px] text-slate-400 truncate">{user.email || '—'}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ring-inset';
  const style = STATUS_STYLES[status] ?? 'bg-slate-50 text-slate-600 ring-slate-600/20 dark:bg-gray-800 dark:text-slate-300 dark:ring-slate-400/20';
  return (
    <span className={`${base} ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {(status || '—').charAt(0) + (status || '').slice(1).toLowerCase()}
    </span>
  );
}

function SortIcon({ direction }) {
  if (direction === 'asc') return <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />;
  if (direction === 'desc') return <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />;
  return <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />;
}

function IconButton({ icon: Icon, title, danger }) {
  return (
    <button
      type="button"
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        danger
          ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function PageButton({ onClick, disabled, title, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-slate-100 dark:divide-gray-800">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-gray-800 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3 w-56 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="h-3.5 w-24 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-5 w-16 bg-slate-100 dark:bg-gray-800 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 flex items-center justify-center mb-4">
        <UserX className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Couldn't load users</p>
      <p className="text-[13px] text-slate-400 mt-1 max-w-sm">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
      >
        <RotateCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-400 flex items-center justify-center mb-4">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
        {hasFilters ? 'No users match your filters' : 'No users yet'}
      </p>
      <p className="text-[13px] text-slate-400 mt-1">
        {hasFilters ? 'Try a different search or status filter.' : 'Users you create will appear here.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
        >
          <Search className="h-4 w-4" />
          Clear filters
        </button>
      )}
    </div>
  );
}
