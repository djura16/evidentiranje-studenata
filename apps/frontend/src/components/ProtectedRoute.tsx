import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { UserRole } from '@evidentiranje/shared';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, isLoading, user } = useAuthContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect based on user role
    if (user?.role === UserRole.ADMIN) {
      return <Navigate to="/admin/users" replace />;
    } else if (user?.role === UserRole.TEACHER) {
      return <Navigate to="/teacher/dashboard" replace />;
    } else if (user?.role === UserRole.STUDENT) {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
