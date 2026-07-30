import { Moon, Sun, Bell, Search, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

export default function Navbar({ title }) {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, text: 'New expense pending approval', time: '5m ago', unread: true },
    { id: 2, text: 'Expense #EXP-003 approved', time: '1h ago', unread: true },
    { id: 3, text: 'Monthly report ready for review', time: '3h ago', unread: false },
  ];

  return (
    <header className="sticky top-0 z-20 glass border-b border-gray-100 dark:border-gray-800/50">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3">
        {/* Title + Search */}
        <div className="flex items-center gap-4 lg:gap-8 flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white lg:ml-0 ml-12 tracking-tight">
            {title}
          </h1>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 w-64">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Search anything..."
              className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 w-full placeholder-gray-400"
            />
            <kbd className="hidden lg:inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-500">⌘K</kbd>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900 animate-pulse" />
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer ${n.unread ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{n.text}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 text-center border-t border-gray-100 dark:border-gray-700">
                    <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">View all notifications</button>
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
