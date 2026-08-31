import {
  LayoutDashboard, Wallet, Plane, Building2, Users, UserCog,
  Shield, Settings, BarChart3, CreditCard, ReceiptText,
  Briefcase, Landmark, Plus, CheckCircle2, BadgeCheck, Tags,
  LayoutGrid, ShieldCheck, KeyRound, KeySquare, ArrowRightLeft, Truck,
  Tag, ShoppingCart, Inbox, FileText,
} from 'lucide-react';

/**
 * Permission-based menu configuration.
 * Each item has `permission` — the permission key required to see it (e.g., 'users:read_all').
 * Use '*' for public access (all authenticated users).
 * Items with `children` render as collapsible submenus; each child has its own `permission`.
 */
export const menuConfig = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
    permission: '*',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: Wallet,
    permission: '*',
    children: [
      { id: 'my-expenses', label: 'My Expenses', icon: ReceiptText, to: '/expenses/my', permission: 'expenses:read' },
      { id: 'all-expenses', label: 'All Expenses', icon: Wallet, to: '/expenses/all', permission: 'expenses:read_all' },
      { id: 'assigned-expenses', label: 'Approvals', icon: CheckCircle2, to: '/expenses/assigned', permission: 'expenses:approvals' },
      { id: 'create-expense', label: 'Create New', icon: Plus, to: '/expenses/new', permission: 'expenses:create' },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: ShoppingCart,
    permission: 'procurement:read',
    children: [
      { id: 'all-procurement', label: 'All Requests', icon: Inbox, to: '/procurement', permission: 'procurement:read_all' },
      { id: 'my-procurement', label: 'My Requests', icon: FileText, to: '/procurement?scope=mine', permission: 'procurement:read' },
      { id: 'new-procurement', label: 'Create New', icon: Plus, to: '/procurement/new', permission: 'procurement:create' },
    ],
  },
  {
    id: 'master',
    label: 'Master Data',
    icon: Briefcase,
    permission: 'companies:read_all',
    children: [
      { id: 'companies', label: 'Companies', icon: Building2, to: '/master/companies', permission: 'companies:read_all' },
      { id: 'vendors', label: 'Vendors', icon: Truck, to: '/master/vendors', permission: 'vendors:read_all' },
      { id: 'vendor-categories', label: 'Vendor Categories', icon: Tag, to: '/master/vendor-categories', permission: 'vendor_categories:read_all' },
      { id: 'departments', label: 'Departments', icon: LayoutGrid, to: '/master/departments', permission: 'departments:read_all' },
      { id: 'users', label: 'Users', icon: Users, to: '/master/users', permission: 'users:read_all' },
      { id: 'categories', label: 'Expense Categories', icon: Tags, to: '/master/categories', permission: 'expense_categories:read_all' },
    ],
  },
  {
    id: 'access',
    label: 'Access Control',
    icon: Shield,
    permission: 'roles:read_all',
    children: [
      { id: 'roles', label: 'Roles', icon: ShieldCheck, to: '/access/roles', permission: 'roles:read_all' },
      { id: 'permissions', label: 'Permissions', icon: KeyRound, to: '/access/permissions', permission: 'permissions:read_all' },
      { id: 'role-permissions', label: 'Role Permissions', icon: KeySquare, to: '/access/role-permissions', permission: 'role_permissions:read_all' },
      { id: 'role-handover-rules', label: 'Role Handover Rules', icon: ArrowRightLeft, to: '/access/role-handover-rules', permission: 'role_handover_rules:read_all' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    to: '/settings',
    permission: '*',
  },
];
