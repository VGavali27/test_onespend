import { Moon, Sun, Bell, Search, Calendar } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

export default function Navbar({ title }) {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Expense approved', desc: 'EXP-003 was approved by Finance', time: '2m ago', unread: true },
    { id: 2, title: 'New expense submitted', desc: 'Sunil submitted a new expense', time: '15m ago', unread: true },
    { id: 3, title: 'Report ready', desc: 'Monthly summary is ready to review', time: '1h ago', unread: false },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        {/* Left: Title */}
        <div className="flex items-center gap-3 ml-10 lg:ml-0">
          <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">{title}</h1>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded">
            <Calendar className="h-3 w-3" />
            Jul 2026
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-3 h-9 w-60 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400">
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
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444] ring-2 ring-white dark:ring-gray-900" />
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Notifications</p>
                      <span className="text-[10px] font-medium text-[#6366f1]">Mark all read</span>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                          n.unread ? 'bg-[#6366f1]/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {n.unread && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#6366f1] flex-shrink-0" />}
                          <div className={n.unread ? '' : 'pl-4'}>
                            <p className="text-[13px] font-medium text-gray-900 dark:text-white">{n.title}</p>
                            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{n.desc}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
