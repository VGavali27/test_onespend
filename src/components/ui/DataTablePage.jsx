import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

/**
 * Full listing page shell: header + search + DataTable + empty/clear-filters.
 *
 * Combines the reusable page pieces so a new listing page only needs to provide
 * title, columns, fetchFn and any page-specific filter controls:
 *
 *   <DataTablePage
 *     title="Users"
 *     subtitle="Manage users and their access"
 *     icon={UsersIcon}
 *     columns={columns}
 *     fetchFn={({ page, limit, sortBy, sortOrder, search }, { signal }) => ({ data, total })}
 *     filterDeps={[statusFilter]}        // refetch when these change
 *     countLabel="user"                  // auto "{total} users" pill
 *     emptyMessage="No users yet"
 *     actions={<status select + buttons />}
 *   />
 */
export default function DataTablePage({
  title,
  subtitle,
  icon: Icon,
  actions,
  columns,
  fetchFn,
  filterDeps = [],
  getRowId = (row) => row.uuid ?? row.id,
  initialSorting = [],
  countLabel = 'record',
  reloadKey = 0,
  emptyMessage = 'No data found',
  hasFilters = false,
  onClearFilters,
  searchPlaceholder = 'Search...',
  emptyIcon,
}) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce the search input before hitting the API
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const anyFilters = searchInput.trim() !== '' || hasFilters;

  const clearAll = () => {
    setSearchInput('');
    setSearch('');
    onClearFilters?.();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
            />
          </div>
          {actions}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        fetchFn={({ page, limit, sortBy, sortOrder }, cfg) =>
          fetchFn({ page, limit, sortBy, sortOrder, search }, cfg)
        }
        filterDeps={[search, ...filterDeps]}
        initialSorting={initialSorting}
        getRowId={getRowId}
        countLabel={countLabel}
        reloadKey={reloadKey}
        emptyMessage={anyFilters ? `No ${countLabel}s match your filters` : emptyMessage}
        emptyAction={
          anyFilters ? (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <Search className="h-4 w-4" />
              Clear filters
            </button>
          ) : null
        }
        emptyIcon={emptyIcon}
      />
    </div>
  );
}
