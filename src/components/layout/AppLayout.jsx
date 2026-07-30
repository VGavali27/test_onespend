import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/expenses': 'Expenses',
  '/companies': 'Companies',
  '/users': 'Users',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const path = window.location.pathname;
  const title = pageTitles[path] || 'Overview';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
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
