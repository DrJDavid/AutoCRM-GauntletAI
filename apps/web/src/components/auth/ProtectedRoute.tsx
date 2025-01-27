import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'agent' | 'customer')[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
}) => {
  const { user, isAuthenticated } = useUserStore()
  const location = useLocation()

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to home page if user doesn't have required role
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
