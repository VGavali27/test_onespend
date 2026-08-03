import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Wallet, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { menuConfig } from '@/data/menuConfig';

const hasAccess = (roles, userRole) => {
  if (!userRole) return false;
  if (roles.includes('*') || roles.includes(userRole)) return true;
  return false;
};

// The parent whose children contain the current path (used to open it on load)
const activeParentId = (menus, pathname) =>
  menus.find((m) => m.children?.some((c) => pathname.startsWith(c.to)))?.id ?? null;

// Single leaf nav link. `nested` = rendered inside a submenu → tighter padding + smaller icon.
function LeafItem({ item, onNavigate, nested = false }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} onClick={onNavigate} className="block">
      {({ isActive }) => (
        <span
          className={`flex items-center gap-2.5 ${nested ? 'px-2.5 py-1.5' : 'px-3 py-2'} rounded-lg text-[13px] font-medium transition-colors ${
            isActive
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800'
          }`}
        >
          <Icon
            className={`${nested ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5'} flex-shrink-0 ${
              nested ? 'text-slate-400 dark:text-slate-500' : ''
            }`}
          />
          <span className="truncate">{item.label}</span>
          {isActive && <span className="ml-auto w-1 h-4 bg-indigo-500 rounded-full" />}
        </span>
      )}
    </NavLink>
  );
}

// Parent item with collapsible submenu. Accordion: only one submenu is open at a time.
function ParentItem({ item, onNavigate, open, toggleMenu }) {
  const Icon = item.icon;
  return (
    <div>
      <button
        onClick={() => toggleMenu(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
          open
            ? 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800'
        }`}
      >
        <Icon className="h-4.5 w-4.5 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{item.label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-1 ml-2 pl-3 border-l border-slate-200 dark:border-gray-700 space-y-0.5 animate-slide-in">
          {item.children.map((child) => (
            <LeafItem key={child.id} item={child} nested onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // The section containing the current page is always open; `preview` lets you
  // peek at another section without closing it. Navigating to a page commits
  // to that section and collapses the rest.
  const [preview, setPreview] = useState(null);

  const activeId = useMemo(() => activeParentId(menuConfig, location.pathname), [location.pathname]);

  useEffect(() => {
    setPreview(null);
  }, [location.pathname]);

  const toggleMenu = (id) => {
    // Clicking the active section (or the currently previewed one) clears previews;
    // clicking any other section previews it while keeping the active one open.
    setPreview((prev) => (prev === id || id === activeId ? null : id));
  };

  const visibleMenus = menuConfig.filter((item) => hasAccess(item.roles, user?.role));

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-slate-200 dark:border-gray-700"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5 text-slate-600 dark:text-gray-300" /> : <Menu className="h-5 w-5 text-slate-600 dark:text-gray-300" />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64
          bg-white dark:bg-gray-900
          border-r border-slate-200 dark:border-gray-800
          transform transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-200 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Wallet className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[15px] text-slate-900 dark:text-white tracking-tight">FinTrack</span>
            <span className="px-1.5 py-0.5 text-[9px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded">PRO</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleMenus.map((item) =>
            item.children ? (
              <ParentItem
                key={item.id}
                item={item}
                onNavigate={() => setMobileOpen(false)}
                open={activeId === item.id || preview === item.id}
                toggleMenu={toggleMenu}
              />
            ) : (
              <LeafItem key={item.id} item={item} onNavigate={() => setMobileOpen(false)} />
            ),
          )}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-slate-700 dark:text-white">
              {user?.first_name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{user?.role || 'Administrator'}</p>
            </div>
            <button onClick={logout} className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}