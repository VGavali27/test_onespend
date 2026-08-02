import { useEffect, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Users as UsersIcon, Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { getUsers } from '@/services/masterService';

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20',
  INACTIVE: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  BLOCKED: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/20',
};

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE', 'BLOCKED'];

// Frontend accessor id → backend sortable attribute name
const SORT_FIELD_MAP = { created_at: 'createdAt', first_name: 'first_name' };

const getFullName = (u) => [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ') || '—';

const getInitials = (u) =>
  ((u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')).toUpperCase() || '?';

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce the search input before hitting the API
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const hasFilters = debouncedSearch.trim() !== '' || statusFilter !== 'ALL';

  const clearFilters = () => {
    setSearchInput('');
    setStatusFilter('ALL');
  };

  // fetchFn receives page params from DataTable and returns the page's rows + total
  const fetchUsers = async ({ page, limit, sortBy, sortOrder }, { signal }) => {
    const { data } = await getUsers(
      {
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter === 'ALL' ? '' : statusFilter,
        sortBy: SORT_FIELD_MAP[sortBy] ?? sortBy,
        sortOrder,
      },
      { signal }
    );
    return { data: data?.data ?? [], total: data?.meta?.total ?? 0 };
  };

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

      {/* Table — self-managed: DataTable owns pagination/sorting/loading/fetching */}
      <DataTable
        columns={columns}
        fetchFn={fetchUsers}
        filterDeps={[debouncedSearch, statusFilter]}
        initialSorting={[{ id: 'created_at', desc: true }]}
        getRowId={(row) => row.uuid}
        countLabel="user"
        emptyMessage={hasFilters ? 'No users match your filters' : 'No users yet'}
        emptyAction={
          hasFilters ? (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <Search className="h-4 w-4" />
              Clear filters
            </button>
          ) : null
        }
      />
    </div>
  );
}

// ── Page-specific presentational helpers ──

const AVATAR_COLORS = [
  'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400',
  'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
];

// Deterministic color per user so avatars aren't all the same shade
const avatarColorFor = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

function UserCell({ user }) {
  const name = getFullName(user);
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-full ${avatarColorFor(name)} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
        {getInitials(user)}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{name}</p>
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
