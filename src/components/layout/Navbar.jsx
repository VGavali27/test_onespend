import { Moon, Sun, Bell, Search, ChevronDown, User, LogOut, Settings, HelpCircle, FileText, ShoppingCart, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useState, useRef, useEffect } from 'react';

// Per-session read tracking — derived feed, so "seen" only persists for this tab
// session (no per-user read-state table). Keeps the bell from re-highlighting items
// the user already looked at during this visit.
const readKeys = new Set();

const KIND_ICON = {
  expense: FileText,
  procurement: ShoppingCart,
  payment: Banknote,
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Navbar({ title }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { count, feed, refresh } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [seen, setSeen] = useState(new Set());
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotificationClick = (n) => {
    readKeys.add(`${n.module}:${n.uuid}`);
    setSeen(new Set(readKeys));
    setShowNotifications(false);
    navigate(n.link);
  };

  const profileItems = [
    { id: 'profile', label: 'My Profile', icon: User, action: () => navigate('/profile') },
    { id: 'settings', label: 'Account Settings', icon: Settings, action: () => navigate('/settings') },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, action: () => {} },
    { id: 'logout', label: 'Logout', icon: LogOut, danger: true, action: logout },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: Title */}
        <div className="flex items-center gap-3 ml-10 lg:ml-0">
          <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">{title}</h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-3 h-9 w-56 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 border border-transparent focus-within:border-[#6366f1]/30">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-[13px] text-gray-700 dark:text-gray-300 w-full placeholder-gray-400"
            />
            <kbd className="text-[9px] font-medium text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1">⌘K</kbd>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) refresh();
              }}
              className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {count.total > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#ef4444] text-white text-[9px] font-semibold flex items-center justify-center">
                  {count.total > 99 ? '99+' : count.total}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Notifications</p>
                  {count.total > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-gray-400">{count.total} pending</span>
                      <button
                        onClick={() => navigate('/expenses/assigned')}
                        className="text-[10px] font-medium text-[#6366f1] hover:underline"
                      >
                        View all
                      </button>
                    </div>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {feed.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="h-6 w-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-[12px] text-gray-400">You're all caught up</p>
                    </div>
                  ) : (
                    feed.map((n) => {
                      const Icon = KIND_ICON[n.kind] || FileText;
                      const isNew = !seen.has(`${n.module}:${n.uuid}`);
                      return (
                        <div
                          key={`${n.module}:${n.uuid}`}
                          onClick={() => handleNotificationClick(n)}
                          className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                            isNew ? 'bg-[#6366f1]/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {isNew && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#6366f1] flex-shrink-0" />}
                            <div className={isNew ? 'min-w-0 flex-1' : 'min-w-0 flex-1 pl-4'}>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                                  {n.title || n.ref}
                                </p>
                                <Icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              </div>
                              <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                {n.ref} {n.status ? `· ${n.status}` : ''}
                                {n.amount ? ` · ₹${n.amount}` : ''}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.at)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-[13px] font-semibold text-white">
                {user?.first_name?.[0] || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[12px] font-medium text-gray-900 dark:text-white leading-tight">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">{user?.role || 'Administrator'}</p>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-20 overflow-hidden animate-scale-in">
                {/* Profile header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-sm font-semibold text-white">
                      {user?.first_name?.[0] || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{user?.email || 'user@company.com'}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  {profileItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setShowProfile(false);
                        item.action();
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors ${
                        item.danger
                          ? 'text-[#ef4444] hover:bg-red-50 dark:hover:bg-red-900/10'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
