import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Page imports
import Homepage from '../pages/public/Homepage';
import AuthPage from '../pages/public/AuthPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import OwnerDashboard from '../pages/owner/OwnerDashboard';
import TenantDashboard from '../pages/tenant/TenantDashboard';

// Role Guard Component
const RoleGuard = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading VastuSetu...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Role check
  if (!allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard based on role
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

// Redirect logged in users away from public Auth pages
const PublicGuard = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />
        <Route 
          path="/auth" 
          element={
            <PublicGuard>
              <AuthPage />
            </PublicGuard>
          } 
        />
        
        {/* Protected Dashboard Routes */}
        <Route 
          path="/admin/*" 
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleGuard>
          } 
        />
        
        <Route 
          path="/manager/*" 
          element={
            <RoleGuard allowedRoles={['manager']}>
              <ManagerDashboard />
            </RoleGuard>
          } 
        />

        <Route 
          path="/owner/*" 
          element={
            <RoleGuard allowedRoles={['owner']}>
              <OwnerDashboard />
            </RoleGuard>
          } 
        />

        <Route 
          path="/tenant/*" 
          element={
            <RoleGuard allowedRoles={['tenant']}>
              <TenantDashboard />
            </RoleGuard>
          } 
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
