import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, Clock, CheckCircle2, XCircle, Sparkles, Receipt, BarChart3, Users, Building2, CreditCard } from 'lucide-react';

const metrics = [
  { label: 'Total Spent', value: '₹ 12.45L', change: '+12.5%', up: true, icon: Wallet, gradient: 'from-indigo-500 to-purple-600' },
  { label: 'Pending', value: '₹ 2.34L', change: '-8.2%', up: false, icon: Clock, gradient: 'from-amber-400 to-orange-500' },
  { label: 'Approved', value: '₹ 8.90L', change: '+23.1%', up: true, icon: CheckCircle2, gradient: 'from-emerald-400 to-green-500' },
  { label: 'Rejected', value: '₹ 1.21L', change: '-3.4%', up: false, icon: XCircle, gradient: 'from-rose-400 to-red-500' },
];

const quickActions = [
  { label: 'New Expense', desc: 'Create expense report', icon: Receipt, gradient: 'from-indigo-500 to-purple-600' },
  { label: 'Analytics', desc: 'View insights', icon: BarChart3, gradient: 'from-emerald-400 to-green-500' },
  { label: 'Approvals', desc: 'Review pending', icon: Clock, gradient: 'from-amber-400 to-orange-500' },
];

const spendingData = [
  { category: 'Travel', amount: '₹ 4,50,000', pct: 36, color: 'bg-indigo-500' },
  { category: 'Office', amount: '₹ 2,80,000', pct: 22, color: 'bg-emerald-500' },
  { category: 'Food', amount: '₹ 1,95,000', pct: 16, color: 'bg-amber-500' },
  { category: 'Utilities', amount: '₹ 1,70,000', pct: 14, color: 'bg-purple-500' },
  { category: 'Others', amount: '₹ 1,50,890', pct: 12, color: 'bg-cyan-500' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Good morning, Admin</h1>
          <p className="text-sm text-gray-400 mt-1">Here's what's happening with your expenses today.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          This Month
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 card-hover cursor-pointer overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 -translate-y-12 translate-x-12 bg-gradient-to-br ${m.gradient} opacity-[0.04] group-hover:opacity-[0.08] rounded-full transition-opacity`} />
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-lg`}>
                <m.icon className="h-5 w-5 text-white" />
              </div>
              <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium ${
                m.up ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}>
                {m.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {m.change}
              </div>
            </div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{m.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((a) => (
          <button key={a.label} className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 card-hover text-left overflow-hidden cursor-pointer">
            <div className={`absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
              <a.icon className="h-5 w-5 text-white" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{a.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
          </button>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Spending Overview */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 card-hover">
          <div className="flex items-center gap-2.5 mb-6">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Spending Overview</h2>
          </div>
          <div className="space-y-4">
            {spendingData.map((d) => (
              <div key={d.category}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{d.category}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{d.amount}</p>
                </div>
                <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className={`h-full rounded-full ${d.color} transition-all duration-1000`} style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 card-hover">
          <div className="flex items-center gap-2.5 mb-6">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Quick Stats</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Active Users', value: '24', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { label: 'Companies', value: '28', icon: Building2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Cards Issued', value: '142', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Avg. Expense', value: '₹ 8,200', icon: Wallet, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2.5`}>
                  <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                </div>
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
