import { ReactNode, useEffect, useState, FC } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { Loader2 } from 'lucide-react';

type UserRole = 'head_admin' | 'admin' | 'agent' | 'customer';

interface Props {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: FC<Props> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const { currentUser, isLoading, checkAuth } = useUserStore();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (!currentUser && !isLoading) {
        await checkAuth();
      }
      setIsInitialLoad(false);
    };

    initAuth();
  }, [checkAuth, currentUser, isLoading]);

  // Show loading state during initial load or auth check
  if (isInitialLoad || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not logged in, redirect to appropriate login page based on the current path
  if (!currentUser) {
    const loginPaths = {
      '/admin': '/auth/team/login',
      '/agent': '/auth/agent/login',
      '/portal': '/auth/customer/login'
    };

    // Find the matching login path based on the current location
    const matchingPath = Object.entries(loginPaths).find(([prefix]) => 
      location.pathname.startsWith(prefix)
    );

    const loginPath = matchingPath ? matchingPath[1] : '/login';
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    
    return <Navigate to={`${loginPath}?redirect=${redirectParam}`} replace />;
  }

  // Check role-based access
  if (allowedRoles) {
    const hasAccess = allowedRoles.some(role => {
      if (role === 'admin') {
        // Allow both admin and head_admin to access admin routes
        return currentUser.role === 'admin' || currentUser.role === 'head_admin';
      }
      return currentUser.role === role;
    });

    if (!hasAccess) {
      // Redirect to appropriate home page based on user role
      switch (currentUser.role) {
        case 'head_admin':
        case 'admin':
          return <Navigate to="/admin" replace />;
        case 'agent':
          return <Navigate to="/agent" replace />;
        case 'customer':
          return <Navigate to="/portal" replace />;
        default:
          return <Navigate to="/" replace />;
      }
    }
  }

  return <>{children}</>;
};