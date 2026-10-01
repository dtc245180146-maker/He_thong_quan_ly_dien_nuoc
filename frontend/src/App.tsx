import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Pages
import { Login } from './pages/Login';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UsersPage } from './pages/admin/UsersPage';
import { RoomsPage } from './pages/admin/RoomsPage';
import { MetersPage } from './pages/admin/MetersPage';
import { PricesPage } from './pages/admin/PricesPage';
import { ReadingsPage } from './pages/admin/ReadingsPage';
import { InvoicesPage } from './pages/admin/InvoicesPage';
import { PaymentsPage } from './pages/admin/PaymentsPage';
import { StatsPage } from './pages/admin/StatsPage';
import { AIAnalysisPage } from './pages/admin/AIAnalysisPage';
import { AIRecsPage } from './pages/admin/AIRecsPage';
import { NotificationsPage } from './pages/admin/NotificationsPage';
import { ProfilePage } from './pages/admin/ProfilePage';

// User Pages
import { UserDashboard } from './pages/user/UserDashboard';
import { MyInvoicesPage } from './pages/user/MyInvoicesPage';
import { MyHistoryPage } from './pages/user/MyHistoryPage';
import { UserAIAnalysisPage } from './pages/user/UserAIAnalysisPage';
import { UserAIRecsPage } from './pages/user/UserAIRecsPage';

// Route Guard component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'USER';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Đang xác thực thông tin tài khoản..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'ADMIN' && !isAdmin) {
    return <Navigate to="/user/dashboard" replace />;
  }

  if (requiredRole === 'USER' && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

// Root index redirect
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Đang tải hệ thống..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={isAdmin ? '/admin/dashboard' : '/user/dashboard'} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Root Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Admin Routes with Dashboard Layout */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="meters" element={<MetersPage />} />
              <Route path="prices" element={<PricesPage />} />
              <Route path="readings" element={<ReadingsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="ai-analysis" element={<AIAnalysisPage />} />
              <Route path="ai-savings" element={<AIRecsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* User Routes with Dashboard Layout */}
            <Route
              path="/user"
              element={
                <ProtectedRoute requiredRole="USER">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/user/dashboard" replace />} />
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="invoices" element={<MyInvoicesPage />} />
              <Route path="history" element={<MyHistoryPage />} />
              <Route path="ai-analysis" element={<UserAIAnalysisPage />} />
              <Route path="ai-savings" element={<UserAIRecsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
