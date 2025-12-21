import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";

interface ProtectedRouteProps {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireHost?: boolean;
  fallbackPath?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireHost = false,
  fallbackPath,
}) => {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath || "/login"} state={{ from: location }} replace />;
  }
  if (requireAdmin && !isAdmin) {
    return <Navigate to={fallbackPath || "/"} replace />;
  }
  if (requireHost && user?.roleName !== 'Host') {
    return <Navigate to={fallbackPath || "/"} replace />;
  }

  // Chặn Admin không được truy cập các routes ngoài /admin
  // Cho phép Admin truy cập: /admin, /login, /logout, /account (profile cá nhân)
  if (isAdmin && user?.roleName === 'Admin') {
    const allowedAdminPaths = ['/admin', '/login', '/account', '/account-password'];
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isAllowedPath = allowedAdminPaths.some(path => location.pathname.startsWith(path));
    
    if (!isAdminRoute && !isAllowedPath && !requireAdmin) {
      // Redirect admin về trang admin nếu cố truy cập routes khác
      return <Navigate to="/admin?tab=dashboard" replace />;
    }
  }

  if (!children) return null;
  return <>{children}</>;
};

export default ProtectedRoute;





