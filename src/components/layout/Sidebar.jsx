import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Building2, Users, Settings, LogOut,
  Menu, X, BarChart3, HelpCircle, ChevronDown, Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/expenses', icon: Wallet, label: 'Expenses' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/companies', icon: Building2, label: 'Companies' },
      { to: '/users', icon: Users, label: 'Users' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
      { to: '/help', icon: HelpCircle, label: 'Help' },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5 text-gray-600 dark:text-gray-300" /> : <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64
          bg-[#0f172a] dark:bg-gray-950
          border-r border-[#1e293b]
          transform transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-[#1e293b]">
          <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center">
            <Wallet className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[15px] text-white tracking-tight">FinTrack</span>
            <span className="px-1.5 py-0.5 text-[9px] font-medium text-[#818cf8] bg-[#6366f1]/10 rounded">PRO</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-2 text-[10px] font-semibold text-[#64748b] uppercase tracking-[0.12em]">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'bg-[#6366f1]/10 text-[#a5b4fc]'
                          : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{label}</span>
                    {isActive && <span className="ml-auto w-1 h-4 bg-[#6366f1] rounded-full" />}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-[#1e293b]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-[#334155] flex items-center justify-center text-sm font-medium text-white">
              {user?.first_name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[11px] text-[#64748b] truncate">{user?.role || 'Administrator'}</p>
            </div>
            <button onClick={logout} className="text-[#64748b] hover:text-white transition-colors" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
