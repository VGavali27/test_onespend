import { TrendingUp, DollarSign, Clock, CheckCircle2, ArrowUpRight, Receipt } from 'lucide-react';

const stats = [
  { label: 'Total Expenses', value: '₹ 0', change: '+0%', icon: DollarSign, color: 'bg-blue-500' },
  { label: 'Pending Approval', value: '0', change: '0', icon: Clock, color: 'bg-yellow-500' },
  { label: 'Approved', value: '0', change: '+0%', icon: CheckCircle2, color: 'bg-green-500' },
  { label: 'This Month', value: '₹ 0', change: '+0%', icon: TrendingUp, color: 'bg-purple-500' },
];

const recentExpenses = [
  { id: 'EXP-001', title: 'Mumbai Business Trip', amount: '₹ 25,000', status: 'DRAFT', date: '2026-07-30' },
  { id: 'EXP-002', title: 'Office Supplies', amount: '₹ 5,000', status: 'PENDING', date: '2026-07-29' },
  { id: 'EXP-003', title: 'Client Dinner', amount: '₹ 8,500', status: 'APPROVED', date: '2026-07-28' },
];

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map(({ label, value, change, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                {change} <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent Expenses */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Expenses</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3">Expense</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3 hidden sm:table-cell">Date</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-white">{exp.id}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{exp.title}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{exp.date}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-white">{exp.amount}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[exp.status]}`}>
                      {exp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recentExpenses.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Receipt className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No expenses yet. Create your first expense to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
