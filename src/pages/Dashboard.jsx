import { useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle2, XCircle,
  Wallet, Receipt, ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Download, Filter, Calendar, Globe, Building2, Users, CreditCard,
} from 'lucide-react';

const stats = [
  {
    label: 'Total Expenses',
    value: '₹ 12,45,890',
    change: '+12.5%',
    trend: 'up',
    subtitle: 'vs last month',
    icon: DollarSign,
    gradient: 'gradient-brand',
    shadow: 'shadow-indigo-500/10',
  },
  {
    label: 'Pending Approval',
    value: '₹ 2,34,500',
    change: '-8.2%',
    trend: 'down',
    subtitle: 'vs last month',
    icon: Clock,
    gradient: 'gradient-warning',
    shadow: 'shadow-amber-500/10',
  },
  {
    label: 'Approved',
    value: '₹ 8,90,200',
    change: '+23.1%',
    trend: 'up',
    subtitle: 'vs last month',
    icon: CheckCircle2,
    gradient: 'gradient-success',
    shadow: 'shadow-emerald-500/10',
  },
  {
    label: 'Rejected',
    value: '₹ 1,21,190',
    change: '-3.4%',
    trend: 'down',
    subtitle: 'vs last month',
    icon: XCircle,
    gradient: 'bg-red-500',
    shadow: 'shadow-red-500/10',
  },
];

const recentExpenses = [
  { id: 'EXP-001', title: 'Mumbai Business Trip — Client Meeting', department: 'Sales', amount: '₹ 25,000', status: 'DRAFT', date: '2026-07-30', initials: 'SK', name: 'Sunil Kumar' },
  { id: 'EXP-002', title: 'Office Supplies & Stationery', department: 'Admin', amount: '₹ 5,000', status: 'PENDING', date: '2026-07-29', initials: 'AP', name: 'Anita Patel' },
  { id: 'EXP-003', title: 'Client Dinner — Oriental Hotel', department: 'Marketing', amount: '₹ 8,500', status: 'APPROVED', date: '2026-07-28', initials: 'RJ', name: 'Rajesh Joshi' },
  { id: 'EXP-004', title: 'Flight Tickets — Delhi Conference', department: 'Sales', amount: '₹ 45,000', status: 'PENDING', date: '2026-07-27', initials: 'PM', name: 'Priya Mehta' },
  { id: 'EXP-005', title: 'Team Lunch — Quarterly Review', department: 'Engineering', amount: '₹ 12,000', status: 'APPROVED', date: '2026-07-26', initials: 'AK', name: 'Arun Kumar' },
];

const statusConfig = {
  DRAFT: { label: 'Draft', class: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  PENDING: { label: 'Pending', class: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  APPROVED: { label: 'Approved', class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  REJECTED: { label: 'Rejected', class: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
};

const spendingByCategory = [
  { category: 'Travel', amount: '₹ 4,50,000', percentage: 36, color: 'bg-indigo-500' },
  { category: 'Office Supplies', amount: '₹ 2,80,000', percentage: 22, color: 'bg-emerald-500' },
  { category: 'Food & Entertainment', amount: '₹ 1,95,000', percentage: 16, color: 'bg-amber-500' },
  { category: 'Utilities', amount: '₹ 1,70,000', percentage: 14, color: 'bg-purple-500' },
  { category: 'Others', amount: '₹ 1,50,890', percentage: 12, color: 'bg-cyan-500' },
];

const quickActions = [
  { label: 'New Expense', icon: Receipt, gradient: 'gradient-brand', desc: 'Create a new expense report' },
  { label: 'View Reports', icon: TrendingUp, gradient: 'gradient-success', desc: 'Analytics & insights' },
  { label: 'Approvals', icon: Clock, gradient: 'gradient-warning', desc: 'Pending items to review' },
];

export default function Dashboard() {
  const [period, setPeriod] = useState('month');

  return (
    <div className="space-y-6 pb-8 animate-[fadeIn_0.5s_ease]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Track and manage your organization's expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
            {['week', 'month', 'quarter', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {stats.map(({ label, value, change, trend, subtitle, icon: Icon, gradient, shadow }) => (
          <div
            key={label}
            className="card-hover bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 -translate-y-8 translate-x-8 rounded-full ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center shadow-lg ${shadow}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium ${
                trend === 'up' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {change}
              </div>
            </div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1.5 stat-value">{value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{subtitle}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map(({ label, icon: Icon, gradient, desc }) => (
          <button key={label} className="card-hover bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-left group cursor-pointer">
            <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center shadow-lg mb-3`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Expenses Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden card-hover">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Receipt className="h-5 w-5 text-indigo-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Recent Expenses</h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Filter className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Expense</th>
                  <th className="px-5 py-3.5">Title</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Department</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {recentExpenses.map((exp) => (
                  <tr key={exp.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {exp.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{exp.id}</p>
                          <p className="text-[11px] text-gray-400">{exp.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-700 dark:text-gray-300 max-w-[200px] truncate">{exp.title}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{exp.department}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{exp.amount}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${statusConfig[exp.status]?.class}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          exp.status === 'APPROVED' ? 'bg-emerald-500' :
                          exp.status === 'PENDING' ? 'bg-amber-500' :
                          exp.status === 'REJECTED' ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        {statusConfig[exp.status]?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Spending by Category */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 card-hover">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Wallet className="h-5 w-5 text-indigo-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Spending</h2>
            </div>
            <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {spendingByCategory.map(({ category, amount, percentage, color }) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{category}</p>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{amount}</p>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick insights */}
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Total spending this period</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">₹ 12,45,890</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
