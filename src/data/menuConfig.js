import {
  LayoutDashboard, Wallet, Plane, Building2, Users, UserCog,
  Shield, Settings, BarChart3, CreditCard, Receipt, FileText,
  Briefcase, Landmark,
} from 'lucide-react';

/**
 * Role-based menu configuration.
 * Each item has `roles` — the roles that can see it.
 * Items with `children` render as collapsible submenus.
 */
export const menuConfig = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
    roles: ['*'], // all roles
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: Wallet,
    roles: ['*'],
    children: [
      { id: 'my-expenses', label: 'My Expenses', to: '/expenses/my', roles: ['*'] },
      { id: 'create-expense', label: 'Create New', to: '/expenses/new', roles: ['*'] },
      { id: 'approvals', label: 'Approvals', to: '/expenses/approvals', roles: ['HOD', 'FINANCE_MGR', 'CFO', 'PAYMENT_MGR', 'TRAVEL_MGR', 'SUPER_ADMIN'] },
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    icon: Plane,
    roles: ['*'],
    children: [
      { id: 'travel-requests', label: 'Travel Requests', to: '/travel/requests', roles: ['*'] },
      { id: 'travel-approvals', label: 'Travel Approvals', to: '/travel/approvals', roles: ['TRAVEL_MGR', 'TRAVEL_JR', 'HOD', 'SUPER_ADMIN'] },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: Landmark,
    roles: ['SUPER_ADMIN', 'CFO', 'FINANCE_MGR', 'FINANCE_JR', 'PAYMENT_MGR', 'PAYMENT_JR'],
    children: [
      { id: 'categories', label: 'Expense Categories', to: '/finance/categories', roles: ['SUPER_ADMIN', 'CFO', 'FINANCE_MGR'] },
      { id: 'payments', label: 'Payments', to: '/finance/payments', roles: ['SUPER_ADMIN', 'CFO', 'PAYMENT_MGR', 'PAYMENT_JR'] },
      { id: 'reports', label: 'Reports', to: '/finance/reports', roles: ['SUPER_ADMIN', 'CFO', 'FINANCE_MGR'] },
    ],
  },
  {
    id: 'master',
    label: 'Master Data',
    icon: Briefcase,
    roles: ['SUPER_ADMIN', 'ADMIN_MGR', 'ADMIN_JR'],
    children: [
      { id: 'companies', label: 'Companies', to: '/master/companies', roles: ['SUPER_ADMIN', 'ADMIN_MGR'] },
      { id: 'departments', label: 'Departments', to: '/master/departments', roles: ['SUPER_ADMIN', 'ADMIN_MGR'] },
      { id: 'users', label: 'Users', to: '/master/users', roles: ['SUPER_ADMIN', 'ADMIN_MGR'] },
      { id: 'user-employments', label: 'Employments', to: '/master/employments', roles: ['SUPER_ADMIN', 'ADMIN_MGR'] },
    ],
  },
  {
    id: 'access',
    label: 'Access Control',
    icon: Shield,
    roles: ['SUPER_ADMIN'],
    children: [
      { id: 'roles', label: 'Roles', to: '/access/roles', roles: ['SUPER_ADMIN'] },
      { id: 'permissions', label: 'Permissions', to: '/access/permissions', roles: ['SUPER_ADMIN'] },
      { id: 'role-permissions', label: 'Role Permissions', to: '/access/role-permissions', roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    to: '/settings',
    roles: ['*'],
  },
];
