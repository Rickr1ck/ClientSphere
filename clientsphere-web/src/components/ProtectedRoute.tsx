// src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { RbacRole } from '@/types/user.types'

interface ProtectedRouteProps {
  allowedRoles?: RbacRole[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, tenantStatus, role } = useAuthStore()
  const location = useLocation()

  // Not logged in — redirect to login, preserve intended destination
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // SuperAdmin is exempt from tenant lifecycle checks
  const isSuperAdmin = role === 'SuperAdmin'

  if (!isSuperAdmin) {
    // Tenant is disabled
    if (tenantStatus === 'Disabled') {
      return <Navigate to="/disabled" replace />
    }

    // Subscription required
    if (tenantStatus === 'PendingPayment' && location.pathname !== '/billing') {
      return <Navigate to="/billing" replace />
    }
  }

  // Logged in but insufficient role
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}