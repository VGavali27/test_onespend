import { useState } from 'react';
import { formatDate } from '@/utils/format';
import { getFullName, getInitials } from '@/utils/user';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Users as UsersIcon, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import DataTablePage from '@/components/ui/DataTablePage';
import StatusBadge from '@/components/ui/StatusBadge';
import { getUsers } from '@/services/masterService';

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE', 'BLOCKED'];

// Frontend accessor id → backend sortable attribute name
const SORT_FIELD_MAP = { createdAt: 'createdAt', first_name: 'first_name' };

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
  columnHelper.accessor('role', {
    header: 'Role',
    enableSorting: false,
    cell: (info) => {
      const role = info.getValue();
      return role?.name ? <RoleBadge role={role} /> : '—';
    },
  }),
  columnHelper.accessor('department', {
    header: 'Department',
    enableSorting: false,
    cell: (info) => info.getValue()?.name || '—',
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.display({
    id: 'actions',
    header: () => <span className="block text-right">Actions</span>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
        <Link
          to={`/master/users/${row.original.uuid}`}
          title="View user"
          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
        >
          <Eye className="h-4 w-4" />
        </Link>
        <Link
          to={`/master/users/${row.original.uuid}/edit`}
          title="Edit user"
          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <IconButton title="Delete user" icon={Trash2} danger />
      </div>
    ),
  }),
];

export default function Users() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const hasFilters = statusFilter !== 'ALL';
  const clearFilters = () => setStatusFilter('ALL');

  const fetchUsers = async ({ page, limit, sortBy, sortOrder, search }, { signal }) => {
    const { data } = await getUsers(
      {
        page,
        limit,
        search,
        status: statusFilter === 'ALL' ? '' : statusFilter,
        sortBy: SORT_FIELD_MAP[sortBy] ?? sortBy,
        sortOrder,
      },
      { signal }
    );
    return { data: data?.data ?? [], total: data?.meta?.total ?? 0 };
  };

  return (
    <DataTablePage
      title="Users"
      subtitle="Manage users and their access"
      icon={UsersIcon}
      columns={columns}
      fetchFn={fetchUsers}
      filterDeps={[statusFilter]}
      countLabel="user"
      emptyMessage="No users yet"
      searchPlaceholder="Search by name, email or mobile..."
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
          <Link
            to="/master/users/new"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Link>
        </>
      }
    />
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
      <div className={`w-9 h-9 rounded-full ${avatarColorFor(name)} ring-1 ring-black/5 dark:ring-white/10 shadow-sm flex items-center justify-center text-xs font-bold flex-shrink-0`}>
        {getInitials(user)}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{name}</p>
        <p className="text-[12px] text-slate-400 truncate">{user.email || '—'}</p>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span
      title={role.code}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-indigo-700 bg-indigo-50 ring-1 ring-inset ring-indigo-600/20 dark:text-indigo-300 dark:bg-indigo-900/20 dark:ring-indigo-400/20"
    >
      {role.name}
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
