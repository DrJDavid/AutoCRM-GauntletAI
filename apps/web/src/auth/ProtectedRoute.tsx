import { ReactNode, useEffect, useState } from 'react';
import { useLocation, Redirect } from 'wouter';
import { useUserStore } from '@/stores/userStore';
import { Loader2 } from 'lucide-react';

type UserRole = 'head_admin' | 'admin' | 'agent' | 'customer';

interface Props {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const [location] = useLocation();
  const { currentUser, isLoading, checkAuth } = useUserStore();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Run an auth check when the component mounts
  useEffect(() => {
    // Only check auth if we don't have a user and aren't already loading
    if (!currentUser && !isLoading && !useUserStore.getState().currentUser) {
      checkAuth();
    }
  }, [checkAuth, currentUser, isLoading]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not logged in, redirect to appropriate login page based on the current path
  if (!currentUser) {
    const loginPaths = {
      '/admin': '/org/login',
      '/agent': '/auth/agent/login',
      '/portal': '/auth/customer/login'
    };

    const loginPath = Object.entries(loginPaths).find(([prefix]) => 
      location.startsWith(prefix)
    )?.[1] || '/auth/customer/login';

    return <Redirect to={`${loginPath}?redirect=${encodeURIComponent(location)}`} />;
  }

  // Check role-based access
  if (allowedRoles) {
    const hasAccess = allowedRoles.some(role => {
      if (role === 'admin') {
        // Allow both 'admin' and 'head_admin' roles when 'admin' is required
        return currentUser.role === 'admin' || currentUser.role === 'head_admin';
      }
      return currentUser.role === role;
    });

    if (!hasAccess) {
      // Redirect to appropriate dashboard based on user role
      switch (currentUser.role) {
        case 'head_admin':
        case 'admin':
          return <Redirect to="/admin/dashboard" />;
        case 'agent':
          return <Redirect to="/agent/dashboard" />;
        case 'customer':
          return <Redirect to="/portal" />;
        default:
          return <Redirect to="/" />;
      }
    }
  }

  return <>{children}</>;
}