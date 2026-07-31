import {
  Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle,
  TrendingUp, Receipt, Users, Building2, Plus, Filter, Calendar,
  ChevronRight, PieChart,
} from 'lucide-react';

const statCards = [
  {
    label: 'Total Spent',
    value: '₹ 12,45,890',
    change: '+12.5%',
    trend: 'up',
    icon: Wallet,
    accent: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    ring: 'ring-indigo-100 dark:ring-indigo-900/30',
  },
  {
    label: 'Pending Approval',
    value: '₹ 2,34,500',
    change: '-8.2%',
    trend: 'down',
    icon: Clock,
    accent: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    ring: 'ring-amber-100 dark:ring-amber-900/30',
  },
  {
    label: 'Approved',
    value: '₹ 8,90,200',
    change: '+23.1%',
    trend: 'up',
    icon: CheckCircle2,
    accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    ring: 'ring-emerald-100 dark:ring-emerald-900/30',
  },
  {
    label: 'Rejected',
    value: '₹ 1,21,190',
    change: '-3.4%',
    trend: 'down',
    icon: XCircle,
    accent: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    ring: 'ring-red-100 dark:ring-red-900/30',
  },
];

// Weekly spending trend — visual bar chart
const weeklyTrend = [
  { day: 'Mon', value: 42 },
  { day: 'Tue', value: 68 },
  { day: 'Wed', value: 35 },
  { day: 'Thu', value: 80 },
  { day: 'Fri', value: 55 },
  { day: 'Sat', value: 30 },
  { day: 'Sun', value: 62 },
];

const spendingByCategory = [
  { category: 'Travel', amount: '₹ 4,50,000', pct: 36, color: 'bg-indigo-500' },
  { category: 'Office Supplies', amount: '₹ 2,80,000', pct: 22, color: 'bg-emerald-500' },
  { category: 'Food & Dining', amount: '₹ 1,95,000', pct: 16, color: 'bg-amber-500' },
  { category: 'Utilities', amount: '₹ 1,70,000', pct: 14, color: 'bg-purple-500' },
  { category: 'Others', amount: '₹ 1,50,890', pct: 12, color: 'bg-slate-400' },
];

const activity = [
  { title: 'Expense EXP-004 submitted', desc: 'Priya Mehta · ₹ 45,000', time: '10 min ago', type: 'submitted', color: 'bg-indigo-500' },
  { title: 'Expense EXP-003 approved', desc: 'Finance Mgr · ₹ 8,500', time: '45 min ago', type: 'approved', color: 'bg-emerald-500' },
  { title: 'Expense EXP-002 sent back', desc: 'HOD · ₹ 5,000', time: '2 hrs ago', type: 'rejected', color: 'bg-red-500' },
  { title: 'New company added', desc: 'Admin Mgr · Kings Digital', time: '3 hrs ago', type: 'created', color: 'bg-purple-500' },
];

const quickActions = [
  { label: 'New Expense', icon: Plus, desc: 'Create expense report', primary: true },
  { label: 'Reports', icon: PieChart, desc: 'View analytics' },
  { label: 'Approvals', icon: Clock, desc: 'Review pending items' },
];

export default function Dashboard() {
  const maxTrend = Math.max(...weeklyTrend.map((d) => d.value));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Good morning, Admin</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            Here's your financial overview for {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
            <Calendar className="h-4 w-4" />
            This Month
          </button>
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors">
            <Plus className="h-4 w-4" />
            New Expense
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map(({ label, icon: Icon, desc, primary }) => (
          <button
            key={label}
            className={`group flex items-center gap-3.5 p-4 rounded-xl border transition-all card-hover text-left ${
              primary
                ? 'bg-indigo-600 border-indigo-600 hover:bg-indigo-700'
                : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              primary ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${primary ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{label}</p>
              <p className={`text-xs ${primary ? 'text-indigo-100' : 'text-slate-400'}`}>{desc}</p>
            </div>
            <ChevronRight className={`ml-auto h-4 w-4 ${primary ? 'text-indigo-200' : 'text-slate-300 dark:text-slate-600'}`} />
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, change, trend, icon: Icon, accent, ring }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5 card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ring-1 ${ring} ${accent} flex items-center justify-center`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
              }`}>
                {trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {change}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Spending trend chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Spending Trend</h2>
                <p className="text-[11px] text-slate-400">Weekly expenditure overview</p>
              </div>
            </div>
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">This week</span>
          </div>

          {/* Bar chart */}
          <div className="flex items-end justify-between gap-3 h-40">
            {weeklyTrend.map(({ day, value }) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {Math.round((value / maxTrend) * 100)}%
                </span>
                <div className="w-full max-w-8 rounded-t-md bg-indigo-100 dark:bg-indigo-900/30 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-500 transition-all duration-300 cursor-pointer"
                  style={{ height: `${(value / maxTrend) * 100}%` }}
                />
                <span className="text-[11px] font-medium text-slate-400">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spending by category */}
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
            {spendingByCategory.map(({ category, amount, pct, color }) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{category}</span>
                  <span className="text-[12px] font-semibold text-slate-900 dark:text-white">{amount}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
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
          {activity.map(({ title, desc, time, color }, i) => (
            <div key={i} className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
              <div className={`w-2 h-2 rounded-full ${color} mt-1.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{title}</p>
                <p className="text-[12px] text-slate-400 truncate">{desc}</p>
              </div>
              <span className="text-[11px] text-slate-400 flex-shrink-0">{time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
