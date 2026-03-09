import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

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
      // Funcionário com permissões pode acessar admin, senão vai para employee
      const perms = (user as any).permissions || [];
      return <Navigate to={perms.length > 0 ? '/admin/dashboard' : '/employee/dashboard'} replace />;
    } else if (user!.role === 'client') {
      return <Navigate to="/client/dashboard" replace />;
    } else {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return <Outlet />;
}
