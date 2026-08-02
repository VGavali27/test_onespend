import { useEffect, useState } from 'react';
import { Users as UsersIcon, Plus, Search, RotateCw, UserX, Inbox } from 'lucide-react';
import { userApi } from '@/services/masterService';

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20',
  INACTIVE: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  BLOCKED: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/20',
};

const getFullName = (u) => [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ') || '—';

const getInitials = (u) =>
  ((u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')).toUpperCase() || '?';

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await userApi.list();
      // Backend envelope: { success, message, data: [...] }
      setUsers(data?.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [getFullName(u), u.email, u.mobile].some((v) => (v || '').toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or mobile..."
              className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
            />
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors">
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <SkeletonRows />
        ) : error ? (
          <ErrorState message={error} onRetry={loadUsers} />
        ) : filtered.length === 0 ? (
          <EmptyState hasQuery={query.trim().length > 0} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-800/50">
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">User</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mobile</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                  {filtered.map((user) => (
                    <tr key={user.uuid} className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {getInitials(user)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{getFullName(user)}</p>
                            <p className="text-[12px] text-slate-400 truncate">{user.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-slate-600 dark:text-slate-300">{user.mobile || '—'}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-slate-500 dark:text-slate-400">{formatDate(user.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-800/50">
              <p className="text-[12px] text-slate-400">
                Showing <span className="font-medium text-slate-600 dark:text-slate-300">{filtered.length}</span> of{' '}
                <span className="font-medium text-slate-600 dark:text-slate-300">{users.length}</span> users
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Presentational helpers (keep in this file until reused) ──

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

function EmptyState({ hasQuery }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-400 flex items-center justify-center mb-4">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
        {hasQuery ? 'No users match your search' : 'No users yet'}
      </p>
      <p className="text-[13px] text-slate-400 mt-1">
        {hasQuery ? 'Try a different name, email or mobile number.' : 'Users you create will appear here.'}
      </p>
    </div>
  );
}
