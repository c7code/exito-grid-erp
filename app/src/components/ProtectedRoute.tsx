import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

// Fallback routes for employees without dashboard access
const employeeFallbackRoutes = [
  '/admin/works',
  '/admin/tasks',
  '/admin/pipeline',
  '/admin/proposals',
  '/admin/clients',
];

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user!.role)) {
    // Redirect to appropriate dashboard based on role
    if (user!.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user!.role === 'employee') {
      // Check if employee has dashboard permission
      if (hasPermission('dashboard')) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      // Otherwise, redirect to the first available module
      for (const route of employeeFallbackRoutes) {
        const module = route.replace('/admin/', '');
        if (hasPermission(module)) {
          return <Navigate to={route} replace />;
        }
      }
      // Ultimate fallback
      return <Navigate to="/admin/works" replace />;
    } else if (user!.role === 'client') {
      return <Navigate to="/client/dashboard" replace />;
    } else {
      return <Navigate to="/admin/works" replace />;
    }
  }

  return <Outlet />;
}

