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

// How much of a leaf's `to` matches the current path (-1 = no match). A leaf matches
// when the path IS its `to`, or descends beneath it (to + '/').
// Also considers query parameters if present in the menu item's `to`.
const matchLen = (to, pathname, search) => {
  // Split the menu item's `to` into path and query parts
  const [toPath, toQuery] = to.split('?');

  // First check path match
  const pathMatch = pathname === toPath ? toPath.length + 1 : pathname.startsWith(`${toPath}/`) ? toPath.length : -1;

  if (pathMatch === -1) return -1;

  // If the menu item has query params, also check they match
  if (toQuery) {
    const currentParams = new URLSearchParams(search);
    const toParams = new URLSearchParams(toQuery);
    // Check if all query params in menu item are present and matching in current URL
    for (const [key, value] of toParams.entries()) {
      if (currentParams.get(key) !== value) {
        return -1; // Query param doesn't match
      }
    }
    // Query params match, add extra priority for exact match
    return pathMatch + toQuery.length + 1;
  }

  return pathMatch;
};

// The single leaf to highlight — the most-specific prefix match, so e.g. on
// /procurement/new only "Create New" is active, not "All Requests" (/procurement).
// Passes both pathname and search (query string) for query-aware matching.
const activeLeafId = (menus, pathname, search) => {
  let best = null;
  let bestLen = -1;
  const walk = (items) => {
    for (const item of items) {
      if (item.children) walk(item.children);
      else if (item.to) {
        const len = matchLen(item.to, pathname, search);
        if (len > bestLen) {
          bestLen = len;
          best = item.id;
        }
      }
    }
  };
  walk(menus);
  return best;
};

// Single leaf nav link. `nested` = rendered inside a submenu → tighter padding + smaller icon.
function LeafItem({ item, onNavigate, nested = false, active = false }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} onClick={onNavigate} className="block">
      <span
        className={`flex items-center gap-2.5 ${nested ? 'px-2.5 py-1.5' : 'px-3 py-2'} rounded-lg text-[13px] font-medium transition-colors ${
          active
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
        {active && <span className="ml-auto w-1 h-4 bg-indigo-500 rounded-full" />}
      </span>
    </NavLink>
  );
}

// Accordion submenu rendered with a CSS height transition (see .submenu in index.css).
// Stays in the DOM and toggles a class, so open/close animates smoothly with no timers.
function Submenu({ open, children }) {
  return (
    <div className={`submenu ${open ? '' : 'closed'}`} aria-hidden={!open}>
      <div className="submenu-inner">
        <div className="mt-1 ml-2 pl-3 border-l border-slate-200 dark:border-gray-700 space-y-0.5">
          {children}
        </div>
      </div>
    </div>
  );
}

// Parent item with collapsible submenu. Accordion: only one submenu is open at a time.
function ParentItem({ item, onNavigate, open, toggleMenu, activeId }) {
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

      <Submenu open={open}>
        {item.children.map((child) => (
          <LeafItem key={child.id} item={child} nested onNavigate={onNavigate} active={activeId === child.id} />
        ))}
      </Submenu>
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // The currently expanded section — only one submenu open at a time.
  // Clicking a parent toggles it, so even the active section can be closed.
  const [openSection, setOpenSection] = useState(null);

  const visibleMenus = menuConfig.filter((item) => hasAccess(item.roles, user?.role));

  // The section to keep open (based on which child matches the current path)
  const parentId = useMemo(() => activeParentId(menuConfig, location.pathname), [location.pathname]);
  // The single leaf to highlight (most-specific prefix match, including query params)
  const leafActive = useMemo(() => activeLeafId(visibleMenus, location.pathname, location.search), [visibleMenus, location.pathname, location.search]);

  // Open the section of the current page when it changes. A manual close is kept
  // until the user navigates to a different section.
  useEffect(() => {
    setOpenSection((prev) => (parentId && prev !== parentId ? parentId : prev));
  }, [parentId]);

  const toggleMenu = (id) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

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
                open={openSection === item.id}
                toggleMenu={toggleMenu}
                activeId={leafActive}
              />
            ) : (
              <LeafItem key={item.id} item={item} onNavigate={() => setMobileOpen(false)} active={leafActive === item.id} />
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