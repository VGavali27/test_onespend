import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Building2, Users, Settings, LogOut,
  Menu, X, ChevronRight, CreditCard, BarChart3, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const navSections = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/expenses', icon: Wallet, label: 'Expenses', badge: '12' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
    ],
  },
  {
    label: 'Master',
    items: [
      { to: '/companies', icon: Building2, label: 'Companies' },
      { to: '/users', icon: Users, label: 'Users' },
      { to: '/cards', icon: CreditCard, label: 'Cards' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
      { to: '/help', icon: HelpCircle, label: 'Help & Support' },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        {mobileOpen ? <X className="h-5 w-5 text-gray-700 dark:text-gray-300" /> : <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
      </button>

      {mobileOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={`
        fixed top-0 left-0 z-40 h-full
        ${collapsed ? 'w-20' : 'w-64'}
        bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        transform transition-all duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        flex flex-col
      `}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-base text-gray-900 dark:text-white tracking-tight">ExpensePro</span>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Enterprise</p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
        >
          <ChevronRight className={`h-3 w-3 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label, badge }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                        collapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                      }`
                    }
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${collapsed ? '' : ''}`} />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {!collapsed && badge && (
                      <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                        {badge}
                      </span>
                    )}
                    {collapsed && (
                      <div className="absolute left-16 px-2 py-1 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                        {label}
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className={`p-3 border-t border-gray-100 dark:border-gray-800 ${collapsed ? 'text-center' : ''}`}>
          <div className={`flex items-center gap-3 p-2 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20 flex-shrink-0">
              {user?.first_name?.[0] || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate">{user?.role}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="flex items-center gap-2 mt-1 w-full px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-medium"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
