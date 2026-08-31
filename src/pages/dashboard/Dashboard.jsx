import { useEffect, useState } from 'react';
import {
  Wallet, Clock, CheckCircle2, XCircle,
  TrendingUp, Receipt, Plus, ChevronRight, PieChart, ArrowUpRight, ArrowDownRight, ShoppingCart, FileText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getDashboard } from '@/services/dashboardService';
import { formatCurrency, formatRelativeTime } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

const ICON_MAP = {
  wallet: Wallet,
  clock: Clock,
  check: CheckCircle2,
  x: XCircle,
  plus: Plus,
  cart: ShoppingCart,
  receipt: Receipt,
  file: FileText,
};

// Roles that see specific quick actions
const MANAGER_ROLES = ['SUPER_ADMIN', 'CFO', 'ADMIN_MGR', 'PAYMENT_MGR', 'PAYMENT_JR', 'FINANCE_MGR', 'FINANCE_JR', 'TRAVEL_MGR', 'HOD', 'EMP_MGR'];
const PROCUREMENT_ROLES = ['SUPER_ADMIN', 'CFO', 'ADMIN_MGR', 'ADMIN_JR'];
const GLOBAL_ROLES = ['SUPER_ADMIN', 'CFO'];

const ACCENT_MAP = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
};

const RING_MAP = {
  indigo: 'ring-indigo-100 dark:ring-indigo-900/30',
  amber: 'ring-amber-100 dark:ring-amber-900/30',
  emerald: 'ring-emerald-100 dark:ring-emerald-900/30',
  red: 'ring-red-100 dark:ring-red-900/30',
  purple: 'ring-purple-100 dark:ring-purple-900/30',
  blue: 'ring-blue-100 dark:ring-blue-900/30',
};

// Frontend mapping from stat card type -> UI properties
const STAT_CARD_UI = {
  my_submitted:      { icon: 'wallet', accent: 'indigo', label: 'My Submitted' },
  my_pending:        { icon: 'clock',  accent: 'amber', label: 'My Pending' },
  pending_approval:  { icon: 'clock',  accent: 'amber', label: 'Pending My Approval' },
  approved:          { icon: 'check',  accent: 'emerald', label: 'Approved' },
  rejected:          { icon: 'x',      accent: 'red',     label: 'Rejected' },
};

const CATEGORY_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-blue-500',
];

const PERIOD_OPTIONS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [period, setPeriod] = useState('this_month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await getDashboard({ period });
      console.log('Dashboard API response:', res);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        console.error('Unexpected response format:', res);
        setError('Invalid response format');
        toast.error('Invalid response from server');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      setError(msg);
      toast.error(`Failed to load dashboard: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const getIcon = (name) => ICON_MAP[name] || Wallet;
  const getAccent = (name) => ACCENT_MAP[name] || ACCENT_MAP.indigo;
  const getRing = (name) => RING_MAP[name] || RING_MAP.indigo;

  const renderSkeleton = (count = 4) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-gray-800" />
            <div className="w-20 h-5 rounded bg-slate-100 dark:bg-gray-800" />
          </div>
          <div className="h-3 w-24 bg-slate-100 dark:bg-gray-800 rounded mb-2" />
          <div className="h-6 w-32 bg-slate-100 dark:bg-gray-800 rounded" />
        </div>
      ))}
    </div>
  );

  const renderStatCards = () => {
    if (!data?.metrics) return renderSkeleton();
    const m = data.metrics;

    // Build stat cards array from raw metrics (frontend decides what to show)
    const cards = [
      { type: 'my_submitted', ...m.mySubmitted },
      ...(m.isManager || m.isGlobal
        ? [{ type: 'pending_approval', ...m.pendingApproval }]
        : [{ type: 'my_pending', ...m.myPending }]),
      { type: 'approved', ...m.approved },
      { type: 'rejected', ...m.rejected },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const ui = STAT_CARD_UI[card.type] || { icon: 'wallet', accent: 'indigo', label: card.type };
          const Icon = getIcon(ui.icon);
          const accent = getAccent(ui.accent);
          const ring = getRing(ui.accent);
          const value = formatCurrency(card.amount);
          const count = card.count > 0 ? ` (${card.count})` : '';
          const trend = card.trend !== null && card.trend !== undefined ? card.trend : 0;
          return (
            <div key={card.type} className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5 card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ring-1 ${ring} ${accent} flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                  trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : trend < 0 ? 'text-red-500' : 'text-slate-400'
                }`}>
                  {trend > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : trend < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}
                  {trend !== 0 ? `${trend > 0 ? '+' : ''}${trend}%` : '—'}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{ui.label}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{value}{count}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSpendingTrend = () => {
    if (!data?.charts?.spendingTrend?.length) {
      return (
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5 animate-pulse">
          <div className="h-5 w-40 bg-slate-100 dark:bg-gray-800 rounded mb-5" />
          <div className="flex items-end justify-between gap-3 h-40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full max-w-8 rounded-t-md bg-slate-100 dark:bg-gray-800 h-20" />
                <div className="h-3 w-8 bg-slate-100 dark:bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    const maxTrend = Math.max(...data.charts.spendingTrend.map(d => d.amount), 1);
    return (
      <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Spending Trend</h2>
              <p className="text-[11px] text-slate-400">Monthly expenditure overview</p>
            </div>
          </div>
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{data.roleContext?.period?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        </div>

        <div className="flex items-end justify-between gap-3 h-40">
          {data.charts.spendingTrend.map(({ label, amount }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-2 group">
              <span className="text-[10px] font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {amount > 0 ? formatCurrency(amount) : '—'}
              </span>
              <div className="w-full max-w-8 rounded-t-md bg-indigo-100 dark:bg-indigo-900/30 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-500 transition-all duration-300 cursor-pointer"
                style={{ height: `${(amount / maxTrend) * 100}%` }}
              />
              <span className="text-[11px] font-medium text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSpendingByCategory = () => {
    if (!data?.charts?.spendingByCategory?.length) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5 animate-pulse">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <PieChart className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Spending by Category</h2>
                <p className="text-[11px] text-slate-400">Where your money goes</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="h-4 w-24 bg-slate-100 dark:bg-gray-800 rounded" />
                  <div className="h-4 w-20 bg-slate-100 dark:bg-gray-800 rounded" />
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                  <div className="h-full rounded-full bg-slate-300 dark:bg-gray-700" style={{ width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PieChart className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Spending by Category</h2>
              <p className="text-[11px] text-slate-400">Where your money goes</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {data.charts.spendingByCategory.map(({ category, amount, pct }, i) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{category}</span>
                <span className="text-[12px] font-semibold text-slate-900 dark:text-white">{formatCurrency(amount)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                <div className={`h-full rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecentActivity = () => {
    if (!data?.recentActivity?.length) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5 animate-pulse">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Recent Activity</h2>
                <p className="text-[11px] text-slate-400">Latest updates across your team</p>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-2 py-2.5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-gray-700 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-4 w-40 bg-slate-100 dark:bg-gray-800 rounded" />
                  <div className="h-3 w-32 bg-slate-100 dark:bg-gray-800 rounded mt-1" />
                </div>
                <div className="h-3 w-16 bg-slate-100 dark:bg-gray-800 rounded flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Recent Activity</h2>
              <p className="text-[11px] text-slate-400">Latest updates across your team</p>
            </div>
          </div>
          <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">View all</button>
        </div>

        <div className="space-y-1">
          {data.recentActivity.map(({ title, remarks, from_role, actor, time, type, expense_uuid }, i) => (
            <div key={expense_uuid || i} className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
              <div className={`w-2 h-2 rounded-full ${
                type === 'APPROVE' ? 'bg-emerald-500' :
                type === 'REJECT' ? 'bg-red-500' :
                type === 'SUBMIT' ? 'bg-indigo-500' :
                'bg-purple-500'
              } mt-1.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{title}</p>
                <p className="text-[12px] text-slate-400 truncate">
                  {actor ? `${actor}${from_role ? ` · ${from_role}` : ''}` : from_role || 'System'}
                  {remarks ? ` · ${remarks}` : ''}
                </p>
              </div>
              <span className="text-[11px] text-slate-400 flex-shrink-0">{formatRelativeTime(time)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuickActions = () => {
    const isManager = MANAGER_ROLES.includes(user?.roleCode);
    const isGlobal = GLOBAL_ROLES.includes(user?.roleCode);
    const isProcurement = PROCUREMENT_ROLES.includes(user?.roleCode);

    const actions = [
      { label: 'New Expense', href: '/expenses/new', icon: 'plus', primary: true },
      ...(isManager || isGlobal ? [{ label: 'My Approvals', href: '/expenses/assigned', icon: 'clock', primary: false }] : []),
      ...(isManager || isGlobal ? [{ label: 'All Expenses', href: '/expenses/all', icon: 'receipt', primary: false }] : []),
      ...(isProcurement ? [{ label: 'Procurement', href: '/procurement', icon: 'cart', primary: false }] : []),
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = getIcon(action.icon);
          return (
            <button
              key={action.href}
              className={`group flex items-center gap-3.5 p-4 rounded-xl border transition-all card-hover text-left ${
                action.primary
                  ? 'bg-indigo-600 border-indigo-600 hover:bg-indigo-700'
                  : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800'
              }`}
              onClick={() => window.location.href = action.href}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                action.primary ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${action.primary ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{action.label}</p>
                <p className={`text-xs ${action.primary ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {action.icon === 'clock' ? 'Review pending items' :
                   action.icon === 'receipt' ? 'View all expenses' :
                   action.icon === 'cart' ? 'Procurement pipeline' : 'Create expense report'}
                </p>
              </div>
              <ChevronRight className={`ml-auto h-4 w-4 ${action.primary ? 'text-indigo-200' : 'text-slate-300 dark:text-slate-600'}`} />
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="h-6 w-64 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-32 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
        {renderSkeleton()}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-5 w-24 bg-slate-100 dark:bg-gray-800 rounded mb-3" />
              <div className="h-10 w-full bg-slate-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {renderSpendingTrend()}
          {renderSpendingByCategory()}
          {renderRecentActivity()}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in text-center py-12">
        <div className="text-red-500">Failed to load dashboard: {error}</div>
        <button onClick={fetchDashboard} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {user ? `Good morning, ${user.first_name || user.email.split('@')[0]}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            Here's your financial overview for {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer transition-colors"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button onClick={() => window.location.href = '/expenses/new'} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors">
            <Plus className="h-4 w-4" />
            New Expense
          </button>
        </div>
      </div>

      {/* Quick actions */}
      {renderQuickActions()}

      {/* Stat cards */}
      {renderStatCards()}

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {renderSpendingTrend()}
        {renderSpendingByCategory()}
        {renderRecentActivity()}
      </div>
    </div>
  );
}