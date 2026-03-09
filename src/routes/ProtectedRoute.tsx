/**
 * Role-based route guard. FR-AUTH-005.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import type { UserRole } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, authChecked } = useAuthStore();
  const location = useLocation();

  if (!authChecked) {
    return <p style={{ padding: 24 }}>Loading...</p>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
