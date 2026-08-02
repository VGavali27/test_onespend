import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Login from '@/pages/auth/Login';
import Dashboard from '@/pages/dashboard/Dashboard';
import Settings from '@/pages/settings/Settings';
import Users from '@/pages/master/Users';
import CreateUser from '@/pages/master/CreateUser';
import EditUser from '@/pages/master/EditUser';
import Profile from '@/pages/profile/Profile';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
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
              <Route path="master/companies" element={<Dashboard />} />
              <Route path="master/departments" element={<Dashboard />} />
              <Route path="master/users" element={<Users />} />
              <Route path="master/users/new" element={<CreateUser />} />
              <Route path="master/users/:uuid/edit" element={<EditUser />} />
              <Route path="master/employments" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
