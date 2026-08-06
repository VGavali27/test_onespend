import {
  LayoutDashboard, Wallet, Plane, Building2, Users, UserCog,
  Shield, Settings, BarChart3, CreditCard, ReceiptText,
  Briefcase, Landmark, Plus, CheckCircle2, BadgeCheck, Tags,
  LayoutGrid, ShieldCheck, KeyRound, KeySquare, ArrowRightLeft, Truck,
  Tag, ShoppingCart,
} from 'lucide-react';

/**
 * Role-based menu configuration.
 * Each item has `roles` — the roles that can see it.
 * Items with `children` render as collapsible submenus; each child has its own `icon`.
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
      { id: 'my-expenses', label: 'My Expenses', icon: ReceiptText, to: '/expenses/my', roles: ['*'] },
      { id: 'all-expenses', label: 'All Expenses', icon: Wallet, to: '/expenses/all', roles: ['SUPER_ADMIN', 'CFO', 'PAYMENT_MGR', 'PAYMENT_JR', 'FINANCE_MGR', 'FINANCE_JR', 'TRAVEL_MGR', 'HOD'] },
      { id: 'create-expense', label: 'Create New', icon: Plus, to: '/expenses/new', roles: ['*'] },
      { id: 'approvals', label: 'Approvals', icon: CheckCircle2, to: '/expenses/approvals', roles: ['HOD', 'FINANCE_MGR', 'CFO', 'PAYMENT_MGR', 'TRAVEL_MGR', 'SUPER_ADMIN'] },
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    icon: Plane,
    roles: ['*'],
    children: [
      { id: 'travel-requests', label: 'Travel Requests', icon: Plane, to: '/travel/requests', roles: ['*'] },
      { id: 'travel-approvals', label: 'Travel Approvals', icon: BadgeCheck, to: '/travel/approvals', roles: ['TRAVEL_MGR', 'TRAVEL_JR', 'HOD', 'SUPER_ADMIN'] },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: Landmark,
    roles: ['SUPER_ADMIN', 'CFO', 'FINANCE_MGR', 'FINANCE_JR', 'PAYMENT_MGR', 'PAYMENT_JR'],
    children: [
      { id: 'payments', label: 'Payments', icon: CreditCard, to: '/finance/payments', roles: ['SUPER_ADMIN', 'CFO', 'PAYMENT_MGR', 'PAYMENT_JR'] },
      { id: 'reports', label: 'Reports', icon: BarChart3, to: '/finance/reports', roles: ['SUPER_ADMIN', 'CFO', 'FINANCE_MGR'] },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: ShoppingCart,
    roles: ['SUPER_ADMIN', 'CFO', 'FINANCE_MGR', 'FINANCE_JR', 'PAYMENT_MGR', 'PAYMENT_JR', 'ADMIN_MGR', 'ADMIN_JR', 'HOD', 'EMP_MGR', 'EMPLOYEE', 'TRAVEL_MGR'],
    children: [
      { id: 'all-procurement', label: 'All Requests', icon: ShoppingCart, to: '/procurement', roles: ['*'] },
      { id: 'new-procurement', label: 'Create New', icon: Plus, to: '/procurement/new', roles: ['*'] },
    ],
  },
  {
    id: 'master',
    label: 'Master Data',
    icon: Briefcase,
    roles: ['SUPER_ADMIN', 'ADMIN_MGR', 'ADMIN_JR'],
    children: [
      { id: 'companies', label: 'Companies', icon: Building2, to: '/master/companies', roles: ['SUPER_ADMIN', 'ADMIN_MGR'] },
      { id: 'vendors', label: 'Vendors', icon: Truck, to: '/master/vendors', roles: ['SUPER_ADMIN', 'ADMIN_MGR'] },
      { id: 'vendor-categories', label: 'Vendor Categories', icon: Tag, to: '/master/vendor-categories', roles: ['SUPER_ADMIN', 'ADMIN_MGR'] },
      { id: 'departments', label: 'Departments', icon: LayoutGrid, to: '/master/departments', roles: ['SUPER_ADMIN', 'ADMIN_MGR'] },
      { id: 'users', label: 'Users', icon: Users, to: '/master/users', roles: ['SUPER_ADMIN', 'ADMIN_MGR'] },
      { id: 'user-employments', label: 'Employments', icon: UserCog, to: '/master/employments', roles: ['SUPER_ADMIN', 'ADMIN_MGR'] },
      { id: 'categories', label: 'Expense Categories', icon: Tags, to: '/master/categories', roles: ['SUPER_ADMIN', 'ADMIN_MGR'] },
    ],
  },
  {
    id: 'access',
    label: 'Access Control',
    icon: Shield,
    roles: ['SUPER_ADMIN'],
    children: [
      { id: 'roles', label: 'Roles', icon: ShieldCheck, to: '/access/roles', roles: ['SUPER_ADMIN'] },
      { id: 'permissions', label: 'Permissions', icon: KeyRound, to: '/access/permissions', roles: ['SUPER_ADMIN'] },
      { id: 'role-permissions', label: 'Role Permissions', icon: KeySquare, to: '/access/role-permissions', roles: ['SUPER_ADMIN'] },
      { id: 'role-handover-rules', label: 'Role Handover Rules', icon: ArrowRightLeft, to: '/access/role-handover-rules', roles: ['SUPER_ADMIN'] },
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
