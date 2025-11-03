import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canViewAllStudents, canManageAuthorities } from '@/lib/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requireAll?: boolean; // If true, requires ALL roles; if false, requires ANY role
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requireAll = false 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check role-based access if requiredRole is specified
  if (requiredRole) {
    const userRole = user?.role;
    
    if (Array.isArray(requiredRole)) {
      // Multiple roles required
      if (requireAll) {
        // User must have ALL roles (rare case)
        const hasAllRoles = requiredRole.every(role => userRole === role);
        if (!hasAllRoles) {
          return <Navigate to="/dashboard" replace />;
        }
      } else {
        // User must have ANY role
        const hasAnyRole = requiredRole.some(role => userRole === role);
        if (!hasAnyRole) {
          return <Navigate to="/dashboard" replace />;
        }
      }
    } else {
      // Single role required
      if (userRole !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // Route-specific role checks
  if (location.pathname === '/students') {
    // Only SUPER_ADMIN can view all students page
    if (!canViewAllStudents(user?.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (location.pathname === '/authorities') {
    // Only SUPER_ADMIN or ADMIN can manage authorities
    if (!canManageAuthorities(user?.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
