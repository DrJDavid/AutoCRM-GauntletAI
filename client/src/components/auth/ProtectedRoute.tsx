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

  if (!currentUser) {
    return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role as UserRole)) {
    return <Redirect to="/unauthorized" />;
  }

  return <>{children}</>;
} 