import { useEffect, useMemo, useState } from 'react';
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
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { userApi } from '@/services/masterService';

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20',
  INACTIVE: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  BLOCKED: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/20',
};

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE', 'BLOCKED'];
const PAGE_SIZES = [10, 25, 50];

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

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Reset to first page whenever a filter or page size changes
  useEffect(() => {
    setPage(1);
  }, [query, status, pageSize]);

  const stats = useMemo(() => {
    const counts = { ACTIVE: 0, INACTIVE: 0, BLOCKED: 0 };
    users.forEach((u) => {
      if (counts[u.status] !== undefined) counts[u.status] += 1;
    });
    return { total: users.length, ...counts };
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (status !== 'ALL' && u.status !== status) return false;
      if (!q) return true;
      return [getFullName(u), u.email, u.mobile].some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [users, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, filtered.length);
  const pageList = getPageList(safePage, totalPages);

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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or mobile..."
              className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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

      {/* Summary chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatChip
          label="Total Users"
          value={stats.total}
          icon={UsersIcon}
          accent="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
        />
        <StatChip
          label="Active"
          value={stats.ACTIVE}
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        />
        <StatChip
          label="Inactive"
          value={stats.INACTIVE}
          icon={Clock}
          accent="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
        />
        <StatChip
          label="Blocked"
          value={stats.BLOCKED}
          icon={UserX}
          accent="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
        />
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <SkeletonRows />
        ) : error ? (
          <ErrorState message={error} onRetry={loadUsers} />
        ) : filtered.length === 0 ? (
          <EmptyState hasQuery={query.trim().length > 0 || status !== 'ALL'} onClear={() => { setQuery(''); setStatus('ALL'); }} />
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-gray-700">
              <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
                {filtered.length} user{filtered.length === 1 ? '' : 's'}
                {status !== 'ALL' && <span className="text-slate-400"> · {status.charAt(0) + status.slice(1).toLowerCase()}</span>}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-800/50">
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">User</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mobile</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Created</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                  {pageItems.map((user) => (
                    <tr key={user.uuid} className="group hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
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
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <IconButton title="View user" icon={Eye} />
                          <IconButton title="Edit user" icon={Pencil} />
                          <IconButton title="Delete user" icon={Trash2} danger />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-800/50">
              <div className="flex items-center gap-4">
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  Showing <span className="font-medium text-slate-700 dark:text-slate-200">{from}</span>
                  {' – '}
                  <span className="font-medium text-slate-700 dark:text-slate-200">{to}</span>
                  {' of '}
                  <span className="font-medium text-slate-700 dark:text-slate-200">{filtered.length}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-slate-400">Rows</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 rounded-md text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none cursor-pointer"
                  >
                    {PAGE_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <PageButton onClick={() => setPage(1)} disabled={safePage === 1} title="First page" icon={ChevronsLeft} />
                <PageButton onClick={() => setPage(safePage - 1)} disabled={safePage === 1} title="Previous page" icon={ChevronLeft} />
                {pageList.map((p, i) =>
                  p === '…' ? (
                    <span key={`e-${i}`} className="px-1.5 text-[12px] text-slate-400 select-none">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-8 h-8 px-2 rounded-md text-[12px] font-semibold transition-colors ${
                        p === safePage
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <PageButton onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages} title="Next page" icon={ChevronRight} />
                <PageButton onClick={() => setPage(totalPages)} disabled={safePage === totalPages} title="Last page" icon={ChevronsRight} />
              </div>
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

function StatChip({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${accent} flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
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

function EmptyState({ hasQuery, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-400 flex items-center justify-center mb-4">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
        {hasQuery ? 'No users match your filters' : 'No users yet'}
      </p>
      <p className="text-[13px] text-slate-400 mt-1">
        {hasQuery ? 'Try a different search or status filter.' : 'Users you create will appear here.'}
      </p>
      {hasQuery && (
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
