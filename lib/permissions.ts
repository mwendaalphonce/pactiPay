// lib/permissions.ts

export type Permission = {
  resource: string
  action: string
  scope?: string | null
}

export type Role = 'SUPER_ADMIN' | 'PAYROLL_MANAGER' | 'HR_MANAGER' | 'VIEWER'

// Permission definitions
export const PERMISSIONS = {
  // Employee permissions
  EMPLOYEES_READ: { resource: 'employees', action: 'read', scope: 'all' },
  EMPLOYEES_WRITE: { resource: 'employees', action: 'write', scope: 'all' },
  EMPLOYEES_DELETE: { resource: 'employees', action: 'delete', scope: 'all' },
  
  // Payroll permissions
  PAYROLL_READ: { resource: 'payroll', action: 'read', scope: 'all' },
  PAYROLL_WRITE: { resource: 'payroll', action: 'write', scope: 'all' },
  PAYROLL_PROCESS: { resource: 'payroll', action: 'process', scope: 'all' },
  PAYROLL_APPROVE: { resource: 'payroll', action: 'approve', scope: 'all' },
  
  // Reports permissions
  REPORTS_READ: { resource: 'reports', action: 'read', scope: 'all' },
  REPORTS_DOWNLOAD: { resource: 'reports', action: 'download', scope: 'all' },
  
  // Settings permissions
  SETTINGS_READ: { resource: 'settings', action: 'read', scope: 'all' },
  SETTINGS_WRITE: { resource: 'settings', action: 'write', scope: 'all' },
} as const

// Check if user has specific permission
export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: { resource: string; action: string; scope?: string }
): boolean {
  return userPermissions.some(
    (p) =>
      p.resource === requiredPermission.resource &&
      p.action === requiredPermission.action &&
      (requiredPermission.scope ? p.scope === requiredPermission.scope : true)
  )
}

// Check if user has any of the required permissions
export function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: Array<{ resource: string; action: string; scope?: string }>
): boolean {
  return requiredPermissions.some((required) =>
    hasPermission(userPermissions, required)
  )
}

// Check if user has all required permissions
export function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: Array<{ resource: string; action: string; scope?: string }>
): boolean {
  return requiredPermissions.every((required) =>
    hasPermission(userPermissions, required)
  )
}

// Check if user has specific role
export function hasRole(userRoles: string[], requiredRole: Role): boolean {
  return userRoles.includes(requiredRole)
}

// Check if user has any of the required roles
export function hasAnyRole(userRoles: string[], requiredRoles: Role[]): boolean {
  return requiredRoles.some((role) => userRoles.includes(role))
}

// Super admin has all permissions
export function isSuperAdmin(userRoles: string[]): boolean {
  return userRoles.includes('SUPER_ADMIN')
}

// Can user perform action?
export function canPerformAction(
  userRoles: string[],
  userPermissions: Permission[],
  action: { resource: string; action: string; scope?: string }
): boolean {
  // Super admin can do everything
  if (isSuperAdmin(userRoles)) {
    return true
  }
  
  // Check specific permission
  return hasPermission(userPermissions, action)
}

// Role-based route access
export const ROUTE_PERMISSIONS: Record<string, { roles?: Role[]; permissions?: Array<{ resource: string; action: string }> }> = {
  '/': { roles: ['SUPER_ADMIN', 'PAYROLL_MANAGER', 'HR_MANAGER', 'VIEWER'] },
  '/employees': { permissions: [PERMISSIONS.EMPLOYEES_READ] },
  '/employees/add': { permissions: [PERMISSIONS.EMPLOYEES_WRITE] },
  '/payroll': { permissions: [PERMISSIONS.PAYROLL_READ] },
  '/payroll/process': { permissions: [PERMISSIONS.PAYROLL_PROCESS] },
  '/reports': { permissions: [PERMISSIONS.REPORTS_READ] },
  '/settings': { roles: ['SUPER_ADMIN'] },
}

// Check if user can access route
export function canAccessRoute(
  route: string,
  userRoles: string[],
  userPermissions: Permission[]
): boolean {
  // Super admin can access everything
  if (isSuperAdmin(userRoles)) {
    return true
  }
  
  const routeConfig = ROUTE_PERMISSIONS[route]
  
  if (!routeConfig) {
    // If route not defined, allow access (you might want to change this)
    return true
  }
  
  // Check role-based access
  if (routeConfig.roles) {
    if (hasAnyRole(userRoles, routeConfig.roles)) {
      return true
    }
  }
  
  // Check permission-based access
  if (routeConfig.permissions) {
    if (hasAnyPermission(userPermissions, routeConfig.permissions)) {
      return true
    }
  }
  
  return false
}