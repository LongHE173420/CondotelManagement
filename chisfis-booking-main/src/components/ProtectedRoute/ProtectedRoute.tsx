import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  fallbackPath,
}) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
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

  return children;
};

export default ProtectedRoute;
