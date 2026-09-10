import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';

/**
 * PermissionGuard - Wraps routes that require specific permissions.
 * 
 * Usage:
 * <Route 
 *   path="/master/companies" 
 *   element={
 *     <PermissionGuard permission="companies:read_all">
 *       <Companies />
 *     </PermissionGuard>
 *   } 
 * />
 * 
 * If permission is '*' or not provided, all authenticated users can access.
 * If user doesn't have permission, shows an access denied page.
 */
export default function PermissionGuard({ children, permission, fallback }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const hasAccess = permission === '*' || !permission || (user?.permissions?.includes(permission) ?? false);

  // While loading auth state, show loader
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Has permission - render children
  if (hasAccess) {
    return children;
  }

  // No permission - show fallback or default access denied
  if (fallback) {
    return fallback;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Lock className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          You don't have permission to access this page.
          <br />
          <span className="font-mono text-sm bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded">
            Required: {permission}
          </span>
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to create a permission-protected route element
 * Usage: 
 * element={withPermission('companies:read_all', <Companies />)}
 */
export function withPermission(permission, component) {
  return (
    <PermissionGuard permission={permission}>
      {component}
    </PermissionGuard>
  );
}