import { ReactNode } from 'react';
import { useLocation, Redirect } from 'wouter';
import { useUserStore } from '@/stores/userStore';

type UserRole = 'admin' | 'agent' | 'customer';

interface Props {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const [location] = useLocation();
  const { currentUser, isLoading } = useUserStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If not logged in, redirect to appropriate login page based on the current path
  if (!currentUser) {
    let loginPath = '/auth/customer/login'; // default

    if (location.startsWith('/admin')) {
      loginPath = '/org/login';
    } else if (location.startsWith('/agent')) {
      loginPath = '/auth/agent/login';
    } else if (location.startsWith('/portal')) {
      loginPath = '/auth/customer/login';
    }

    return <Redirect to={`${loginPath}?redirect=${encodeURIComponent(location)}`} />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(currentUser.role as UserRole)) {
    // Redirect to appropriate dashboard based on user's role
    switch (currentUser.role) {
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

  return <>{children}</>;
}