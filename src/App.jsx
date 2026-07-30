import { Home, DollarSign, Users, Building2, Settings, Menu } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <DollarSign className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg">Expense Manager</span>
        </div>
        <nav className="space-y-1">
          {[
            { icon: Home, label: 'Dashboard' },
            { icon: DollarSign, label: 'Expenses' },
            { icon: Building2, label: 'Companies' },
            { icon: Users, label: 'Users' },
            { icon: Settings, label: 'Settings' },
          ].map(({ icon: Icon, label }) => (
            <a
              key={label}
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        <div className="max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-500 mb-8">Welcome to the expense management system</p>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Total Expenses', value: '₹ 0', color: 'bg-blue-500' },
              { label: 'Pending Approval', value: '0', color: 'bg-yellow-500' },
              { label: 'Companies', value: '28', color: 'bg-green-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className={`w-10 h-10 rounded-lg ${color} mb-4`} />
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Recent expenses */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Recent Expenses</h2>
            <p className="text-gray-400 text-sm">No expenses yet. Create your first expense to get started.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
