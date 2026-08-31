import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PermissionGuard from '@/components/PermissionGuard';
import AppLayout from '@/components/layout/AppLayout';

// Pages are code-split (loaded on demand) so the initial bundle stays small.
const Login = lazy(() => import('@/pages/auth/Login'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));

const MyExpenses = lazy(() => import('@/pages/expenses/MyExpenses'));
const AllExpenses = lazy(() => import('@/pages/expenses/AllExpenses'));
const AssignedExpenses = lazy(() => import('@/pages/expenses/AssignedExpenses'));
const CreateExpense = lazy(() => import('@/pages/expenses/CreateExpense'));
const EditExpense = lazy(() => import('@/pages/expenses/EditExpense'));
const ExpenseDetail = lazy(() => import('@/pages/expenses/ExpenseDetail'));

const Users = lazy(() => import('@/pages/master/users/Users'));
const CreateUser = lazy(() => import('@/pages/master/users/CreateUser'));
const EditUser = lazy(() => import('@/pages/master/users/EditUser'));
const ViewUser = lazy(() => import('@/pages/master/users/ViewUser'));

const Companies = lazy(() => import('@/pages/master/companies/Companies'));
const CreateCompany = lazy(() => import('@/pages/master/companies/CreateCompany'));
const EditCompany = lazy(() => import('@/pages/master/companies/EditCompany'));
const ViewCompany = lazy(() => import('@/pages/master/companies/ViewCompany'));

const Vendors = lazy(() => import('@/pages/master/vendors/Vendors'));
const CreateVendor = lazy(() => import('@/pages/master/vendors/CreateVendor'));
const EditVendor = lazy(() => import('@/pages/master/vendors/EditVendor'));
const ViewVendor = lazy(() => import('@/pages/master/vendors/ViewVendor'));

const VendorCategories = lazy(() => import('@/pages/master/vendorCategories/VendorCategories'));
const CreateVendorCategory = lazy(() => import('@/pages/master/vendorCategories/CreateVendorCategory'));
const EditVendorCategory = lazy(() => import('@/pages/master/vendorCategories/EditVendorCategory'));
const ViewVendorCategory = lazy(() => import('@/pages/master/vendorCategories/ViewVendorCategory'));

const Procurements = lazy(() => import('@/pages/procurement/Procurements'));
const CreateProcurement = lazy(() => import('@/pages/procurement/CreateProcurement'));
const EditProcurement = lazy(() => import('@/pages/procurement/EditProcurement'));
const ProcurementDetail = lazy(() => import('@/pages/procurement/ProcurementDetail'));

const Departments = lazy(() => import('@/pages/master/departments/Departments'));
const CreateDepartment = lazy(() => import('@/pages/master/departments/CreateDepartment'));
const EditDepartment = lazy(() => import('@/pages/master/departments/EditDepartment'));
const ViewDepartment = lazy(() => import('@/pages/master/departments/ViewDepartment'));

const Roles = lazy(() => import('@/pages/access/roles/Roles'));
const CreateRole = lazy(() => import('@/pages/access/roles/CreateRole'));
const EditRole = lazy(() => import('@/pages/access/roles/EditRole'));
const ViewRole = lazy(() => import('@/pages/access/roles/ViewRole'));

const Permissions = lazy(() => import('@/pages/access/permissions/Permissions'));
const CreatePermission = lazy(() => import('@/pages/access/permissions/CreatePermission'));
const EditPermission = lazy(() => import('@/pages/access/permissions/EditPermission'));
const ViewPermission = lazy(() => import('@/pages/access/permissions/ViewPermission'));

const RolePermissions = lazy(() => import('@/pages/access/rolePermissions/RolePermissions'));

const RoleHandoverRules = lazy(() => import('@/pages/access/roleHandoverRules/RoleHandoverRules'));
const RoleHandoverRuleEdit = lazy(() => import('@/pages/access/roleHandoverRules/RoleHandoverRuleEdit'));

const Profile = lazy(() => import('@/pages/profile/Profile'));
const Settings = lazy(() => import('@/pages/settings/Settings'));

const Categories = lazy(() => import('@/pages/finance/categories/Categories'));
const CreateCategory = lazy(() => import('@/pages/finance/categories/CreateCategory'));
const EditCategory = lazy(() => import('@/pages/finance/categories/EditCategory'));
const ViewCategory = lazy(() => import('@/pages/finance/categories/ViewCategory'));

// Shown briefly while a lazily-loaded page chunk downloads
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="expenses/my" element={<PermissionGuard permission="expenses:read"><MyExpenses /></PermissionGuard>} />
          <Route path="expenses/all" element={<PermissionGuard permission="expenses:read_all"><AllExpenses /></PermissionGuard>} />
          <Route path="expenses/assigned" element={<PermissionGuard permission="expenses:approvals"><AssignedExpenses /></PermissionGuard>} />
          <Route path="expenses/new" element={<PermissionGuard permission="expenses:create"><CreateExpense /></PermissionGuard>} />
          <Route path="expenses/:uuid/edit" element={<PermissionGuard permission="expenses:update"><EditExpense /></PermissionGuard>} />
          <Route path="expenses/:id" element={<PermissionGuard permission="expenses:read"><ExpenseDetail /></PermissionGuard>} />

          <Route path="master/companies" element={<PermissionGuard permission="companies:read_all"><Companies /></PermissionGuard>} />
          <Route path="master/companies/new" element={<PermissionGuard permission="companies:create"><CreateCompany /></PermissionGuard>} />
          <Route path="master/companies/:uuid/edit" element={<PermissionGuard permission="companies:update"><EditCompany /></PermissionGuard>} />
          <Route path="master/companies/:uuid" element={<PermissionGuard permission="companies:read"><ViewCompany /></PermissionGuard>} />

          <Route path="master/vendors" element={<PermissionGuard permission="vendors:read_all"><Vendors /></PermissionGuard>} />
          <Route path="master/vendors/new" element={<PermissionGuard permission="vendors:create"><CreateVendor /></PermissionGuard>} />
          <Route path="master/vendors/:uuid/edit" element={<PermissionGuard permission="vendors:update"><EditVendor /></PermissionGuard>} />
          <Route path="master/vendors/:uuid" element={<PermissionGuard permission="vendors:read"><ViewVendor /></PermissionGuard>} />

          <Route path="master/vendor-categories" element={<PermissionGuard permission="vendor_categories:read_all"><VendorCategories /></PermissionGuard>} />
          <Route path="master/vendor-categories/new" element={<PermissionGuard permission="vendor_categories:create"><CreateVendorCategory /></PermissionGuard>} />
          <Route path="master/vendor-categories/:uuid/edit" element={<PermissionGuard permission="vendor_categories:update"><EditVendorCategory /></PermissionGuard>} />
          <Route path="master/vendor-categories/:uuid" element={<PermissionGuard permission="vendor_categories:read"><ViewVendorCategory /></PermissionGuard>} />

          <Route path="procurement" element={<PermissionGuard permission="procurement:read_all"><Procurements /></PermissionGuard>} />
          <Route path="procurement/new" element={<PermissionGuard permission="procurement:create"><CreateProcurement /></PermissionGuard>} />
          <Route path="procurement/:uuid/edit" element={<PermissionGuard permission="procurement:update"><EditProcurement /></PermissionGuard>} />
          <Route path="procurement/:uuid" element={<PermissionGuard permission="procurement:read"><ProcurementDetail /></PermissionGuard>} />

          <Route path="master/departments" element={<PermissionGuard permission="departments:read_all"><Departments /></PermissionGuard>} />
          <Route path="master/departments/new" element={<PermissionGuard permission="departments:create"><CreateDepartment /></PermissionGuard>} />
          <Route path="master/departments/:uuid/edit" element={<PermissionGuard permission="departments:update"><EditDepartment /></PermissionGuard>} />
          <Route path="master/departments/:uuid" element={<PermissionGuard permission="departments:read"><ViewDepartment /></PermissionGuard>} />

          <Route path="master/users" element={<PermissionGuard permission="users:read_all"><Users /></PermissionGuard>} />
          <Route path="master/users/new" element={<PermissionGuard permission="users:create"><CreateUser /></PermissionGuard>} />
          <Route path="master/users/:uuid/edit" element={<PermissionGuard permission="users:update"><EditUser /></PermissionGuard>} />
          <Route path="master/users/:uuid" element={<PermissionGuard permission="users:read"><ViewUser /></PermissionGuard>} />

          <Route path="access/roles" element={<PermissionGuard permission="roles:read_all"><Roles /></PermissionGuard>} />
          <Route path="access/roles/new" element={<PermissionGuard permission="roles:create"><CreateRole /></PermissionGuard>} />
          <Route path="access/roles/:uuid/edit" element={<PermissionGuard permission="roles:update"><EditRole /></PermissionGuard>} />
          <Route path="access/roles/:uuid" element={<PermissionGuard permission="roles:read"><ViewRole /></PermissionGuard>} />

          <Route path="access/permissions" element={<PermissionGuard permission="permissions:read_all"><Permissions /></PermissionGuard>} />
          <Route path="access/permissions/new" element={<PermissionGuard permission="permissions:create"><CreatePermission /></PermissionGuard>} />
          <Route path="access/permissions/:uuid/edit" element={<PermissionGuard permission="permissions:update"><EditPermission /></PermissionGuard>} />
          <Route path="access/permissions/:uuid" element={<PermissionGuard permission="permissions:read"><ViewPermission /></PermissionGuard>} />

          <Route path="access/role-permissions" element={<PermissionGuard permission="role_permissions:read_all"><RolePermissions /></PermissionGuard>} />

          <Route path="access/role-handover-rules" element={<PermissionGuard permission="role_handover_rules:read_all"><RoleHandoverRules /></PermissionGuard>} />
          <Route path="access/role-handover-rules/edit" element={<PermissionGuard permission="role_handover_rules:update"><RoleHandoverRuleEdit /></PermissionGuard>} />

          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />

          <Route path="master/categories" element={<PermissionGuard permission="expense_categories:read_all"><Categories /></PermissionGuard>} />
          <Route path="master/categories/new" element={<PermissionGuard permission="expense_categories:create"><CreateCategory /></PermissionGuard>} />
          <Route path="master/categories/:uuid/edit" element={<PermissionGuard permission="expense_categories:update"><EditCategory /></PermissionGuard>} />
          <Route path="master/categories/:uuid" element={<PermissionGuard permission="expense_categories:read"><ViewCategory /></PermissionGuard>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
