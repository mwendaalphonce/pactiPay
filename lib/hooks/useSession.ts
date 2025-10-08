// lib/hooks/useSession.ts
'use client'

import { useSession as useNextAuthSession } from 'next-auth/react'

export function useSession() {
  const { data: session, status, update } = useNextAuthSession()

  return {
    session,
    status,
    update,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    user: session?.user,
    company: session?.user?.company,
    hasCompletedOnboarding: session?.user?.hasCompletedOnboarding || false,
    roles: session?.user?.roles || [],
    permissions: session?.user?.permissions || [],
  }
}

// Permission checker hook
export function usePermissions() {
  const { permissions, roles } = useSession()

  const hasPermission = (resource: string, action: string, scope?: string) => {
    // Super admin has all permissions
    if (roles.includes('SUPER_ADMIN')) {
      return true
    }

    return permissions.some(
      (p) =>
        p.resource === resource &&
        p.action === action &&
        (scope ? p.scope === scope : true)
    )
  }

  const hasRole = (role: string) => {
    return roles.includes(role)
  }

  const hasAnyRole = (rolesList: string[]) => {
    return rolesList.some((role) => roles.includes(role))
  }

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    permissions,
    roles,
  }
}