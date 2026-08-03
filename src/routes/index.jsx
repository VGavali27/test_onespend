import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

// Pages are code-split (loaded on demand) so the initial bundle stays small.
const Login = lazy(() => import('@/pages/auth/Login'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));

const Users = lazy(() => import('@/pages/master/users/Users'));
const CreateUser = lazy(() => import('@/pages/master/users/CreateUser'));
const EditUser = lazy(() => import('@/pages/master/users/EditUser'));
const ViewUser = lazy(() => import('@/pages/master/users/ViewUser'));

const Companies = lazy(() => import('@/pages/master/companies/Companies'));
const CreateCompany = lazy(() => import('@/pages/master/companies/CreateCompany'));
const EditCompany = lazy(() => import('@/pages/master/companies/EditCompany'));
const ViewCompany = lazy(() => import('@/pages/master/companies/ViewCompany'));

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
          <Route path="expenses" element={<Dashboard />} />

          <Route path="master/companies" element={<Companies />} />
          <Route path="master/companies/new" element={<CreateCompany />} />
          <Route path="master/companies/:uuid/edit" element={<EditCompany />} />
          <Route path="master/companies/:uuid" element={<ViewCompany />} />

          <Route path="master/departments" element={<Departments />} />
          <Route path="master/departments/new" element={<CreateDepartment />} />
          <Route path="master/departments/:uuid/edit" element={<EditDepartment />} />
          <Route path="master/departments/:uuid" element={<ViewDepartment />} />

          <Route path="master/users" element={<Users />} />
          <Route path="master/users/new" element={<CreateUser />} />
          <Route path="master/users/:uuid/edit" element={<EditUser />} />
          <Route path="master/users/:uuid" element={<ViewUser />} />
          <Route path="master/employments" element={<Dashboard />} />

          <Route path="access/roles" element={<Roles />} />
          <Route path="access/roles/new" element={<CreateRole />} />
          <Route path="access/roles/:uuid/edit" element={<EditRole />} />
          <Route path="access/roles/:uuid" element={<ViewRole />} />

          <Route path="access/permissions" element={<Permissions />} />
          <Route path="access/permissions/new" element={<CreatePermission />} />
          <Route path="access/permissions/:uuid/edit" element={<EditPermission />} />
          <Route path="access/permissions/:uuid" element={<ViewPermission />} />

          <Route path="access/role-permissions" element={<RolePermissions />} />

          <Route path="access/role-handover-rules" element={<RoleHandoverRules />} />
          <Route path="access/role-handover-rules/edit" element={<RoleHandoverRuleEdit />} />

          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />

          <Route path="master/categories" element={<Categories />} />
          <Route path="master/categories/new" element={<CreateCategory />} />
          <Route path="master/categories/:uuid/edit" element={<EditCategory />} />
          <Route path="master/categories/:uuid" element={<ViewCategory />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
