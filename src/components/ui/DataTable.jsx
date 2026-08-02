import { useEffect, useRef, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Inbox,
  RotateCw,
} from 'lucide-react';

const DEFAULT_PAGE_SIZES = [10, 25, 50];

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

/**
 * Reusable data table built on TanStack Table.
 *
 * SIMPLE (recommended) — self-managed fetching:
 *   <DataTable
 *     columns={columns}
 *     fetchFn={({ page, limit, sortBy, sortOrder }, { signal }) => ({ data, total })}
 *     filterDeps={[search, status]}   // refetch + jump to page 1 when these change
 *     initialSorting={[{ id: 'created_at', desc: true }]}
 *     getRowId={(row) => row.uuid}
 *     countLabel="user"               // renders "{total} users" pill
 *   />
 *   The component owns pagination, sorting, loading, error, and the fetch.
 *
 * ADVANCED (controlled) — you own the state:
 *   pass data, rowCount, loading, error, pagination/onPaginationChange,
 *   sorting/onSortingChange. Omit fetchFn.
 */
export default function DataTable({
  columns,
  // ── Self-managed mode (recommended) ──
  fetchFn,
  filterDeps = [],
  initialSorting = [],
  // ── Controlled mode (advanced) — omit fetchFn ──
  data: controlledData,
  rowCount: controlledRowCount,
  loading: controlledLoading,
  error: controlledError,
  onRetry: controlledOnRetry,
  pagination: controlledPagination,
  onPaginationChange,
  sorting: controlledSorting,
  onSortingChange,
  // ── Common ──
  getRowId,
  countLabel,
  toolbar,
  reloadKey = 0,
  emptyMessage = 'No data found',
  emptyAction,
  emptyIcon: EmptyIcon = Inbox,
  onRowClick,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}) {
  const isSelfManaged = Boolean(fetchFn);

  // Internal state (self-managed mode)
  const [internalData, setInternalData] = useState([]);
  const [internalRowCount, setInternalRowCount] = useState(0);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState(initialSorting);
  const [retryKey, setRetryKey] = useState(0);

  // Keep the latest fetchFn in a ref so the fetch effect doesn't re-run every render
  const fetchFnRef = useRef(fetchFn);
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  });

  // Jump back to the first page when a filter changes (self-managed mode)
  useEffect(() => {
    if (!isSelfManaged) return;
    setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }));
  }, filterDeps);

  // Fetch the current page (self-managed mode)
  useEffect(() => {
    if (!isSelfManaged) return;
    const controller = new AbortController();
    const run = async () => {
      setInternalLoading(true);
      setInternalError(null);
      try {
        const result = await fetchFnRef.current(
          {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            sortBy: sorting[0]?.id,
            sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
          },
          { signal: controller.signal }
        );
        setInternalData(result?.data ?? []);
        setInternalRowCount(result?.total ?? 0);
      } catch (err) {
        if (err?.code !== 'ERR_CANCELED') {
          setInternalError(err?.response?.data?.message || 'Failed to load data. Please try again.');
        }
      } finally {
        setInternalLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [pagination, sorting, reloadKey, retryKey, ...filterDeps]);

  // Resolve effective props (self-managed vs controlled)
  const effective = isSelfManaged
    ? {
        data: internalData,
        rowCount: internalRowCount,
        loading: internalLoading,
        error: internalError,
        onRetry: () => setRetryKey((k) => k + 1),
        pagination,
        setPagination,
        sorting,
        setSorting,
      }
    : {
        data: controlledData ?? [],
        rowCount: controlledRowCount ?? 0,
        loading: controlledLoading ?? false,
        error: controlledError ?? null,
        onRetry: controlledOnRetry,
        pagination: controlledPagination ?? { pageIndex: 0, pageSize: 10 },
        setPagination: onPaginationChange ?? setPagination,
        sorting: controlledSorting ?? [],
        setSorting: onSortingChange ?? setSorting,
      };

  const table = useReactTable({
    data: effective.data,
    columns,
    state: { sorting: effective.sorting, pagination: effective.pagination },
    onSortingChange: effective.setSorting,
    onPaginationChange: effective.setPagination,
    manualPagination: true,
    manualSorting: true,
    rowCount: effective.rowCount,
    getCoreRowModel: getCoreRowModel(),
    ...(getRowId ? { getRowId } : {}),
  });

  const { pageIndex, pageSize } = effective.pagination;
  const total = effective.rowCount;
  const pageCount = table.getPageCount();
  const pageList = getPageList(pageIndex + 1, pageCount);
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);
  const initialLoading = effective.loading && effective.data.length === 0;

  const renderedToolbar =
    toolbar ??
    (countLabel ? (
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-gray-700">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
          {total} {countLabel}
          {total === 1 ? '' : 's'}
        </span>
      </div>
    ) : null);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {renderedToolbar}

      {initialLoading ? (
        <SkeletonRows />
      ) : effective.error ? (
        <ErrorState message={effective.error} onRetry={effective.onRetry} />
      ) : effective.data.length === 0 ? (
        <EmptyState message={emptyMessage} action={emptyAction} Icon={EmptyIcon} />
      ) : (
        <>
          <div className={`overflow-x-auto transition-opacity ${effective.loading ? 'opacity-60' : ''}`}>
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
                        className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
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
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={`group border-l-2 border-l-transparent hover:border-l-indigo-500 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
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

          {/* Pagination footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-800/50">
            <div className="flex items-center gap-4">
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Showing <span className="font-medium text-slate-700 dark:text-slate-200">{from}</span>–
                <span className="font-medium text-slate-700 dark:text-slate-200">{to}</span>
                {' of '}
                <span className="font-medium text-slate-700 dark:text-slate-200">{total}</span>
                {effective.loading && (
                  <span className="inline-flex items-center gap-1.5 ml-3 text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Updating...
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-slate-400">Rows</span>
                <select
                  value={pageSize}
                  onChange={(e) =>
                    effective.setPagination((p) => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))
                  }
                  className="px-2 py-1 rounded-md text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none cursor-pointer"
                >
                  {pageSizeOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <PageButton
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                title="First page"
                icon={ChevronsLeft}
              />
              <PageButton
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                title="Previous page"
                icon={ChevronLeft}
              />
              {pageList.map((p, i) =>
                p === '…' ? (
                  <span key={`e-${i}`} className="px-1.5 text-[12px] text-slate-400 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => table.setPageIndex(p - 1)}
                    className={`min-w-8 h-8 px-2 rounded-md text-[12px] font-semibold border transition-colors ${
                      p === pageIndex + 1
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                        : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <PageButton
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                title="Next page"
                icon={ChevronRight}
              />
              <PageButton
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
                title="Last page"
                icon={ChevronsRight}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Internal presentational helpers ──

function SortIcon({ direction }) {
  if (direction === 'asc') return <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />;
  if (direction === 'desc') return <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />;
  return <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />;
}

function PageButton({ onClick, disabled, title, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
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
          <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-40" />
            <div className="skeleton h-3 w-56" />
          </div>
          <div className="skeleton h-3.5 w-24" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 flex items-center justify-center mb-4">
        <RotateCw className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Couldn't load data</p>
      <p className="text-[13px] text-slate-400 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
        >
          <RotateCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}

function EmptyState({ message, action, Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-400 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
