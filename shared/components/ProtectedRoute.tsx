import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { hasPermission, hasAnyPermission } from '../utils/permissions';
import { shouldRedirectUser, getRedirectUrl } from '../utils/routing';
import LoadingSpinner from './LoadingSpinner';
import AccessDenied from './AccessDenied';
import type { UserRole } from '../utils/routing';
import type { AuthContextType } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermissions?: Array<{ resource: string; action: string }>;
  requireAllPermissions?: boolean;
  fallbackRoute?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  requireAllPermissions = false,
  fallbackRoute
}) => {
  const { user, userData, loading, userDataLoading } = useAuth() as AuthContextType;

  // Show loading spinner while checking authentication
  if (loading || userDataLoading) {
    return <LoadingSpinner size="lg" message="Checking permissions..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user has userData and is authorized
  if (!userData) {
    return (
      <AccessDenied
        title="Account Setup Required"
        message="Your account is being configured. Please contact support if this persists."
        showBackButton={false}
      />
    );
  }

  // Check role-based app access and redirect if needed
  if (shouldRedirectUser(userData.role)) {
    const redirectUrl = getRedirectUrl(userData.role);
    window.location.href = redirectUrl;
    return null;
  }

  // Check specific role requirements
  if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
    if (fallbackRoute) {
      return <Navigate to={fallbackRoute} replace />;
    }
    return <AccessDenied />;
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? hasAnyPermission(userData.role, requiredPermissions)
      : hasAnyPermission(userData.role, requiredPermissions);

    if (!hasRequiredPermissions) {
      if (fallbackRoute) {
        return <Navigate to={fallbackRoute} replace />;
      }
      return (
        <AccessDenied
          message="You don't have the required permissions to access this page."
        />
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;