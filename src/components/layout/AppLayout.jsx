import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/companies': 'Companies',
  '/users': 'Users',
  '/settings': 'Settings',
  '/help': 'Help',
};

export default function AppLayout() {
  const path = window.location.pathname;
  const title = pageTitles[path] || 'Overview';

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar title={title} />
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
