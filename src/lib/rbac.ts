/**
 * RBAC (Role-Based Access Control) Utility
 * 
 * Centralized permission checking for ShreeHR.
 * All permission checks should go through this module.
 */

import type { Session } from 'next-auth';
import { logPermissionDenied } from './audit';

// User roles ordered by privilege level (lowest to highest)
export type UserRole = 
  | 'EMPLOYEE'
  | 'HR_MANAGER'
  | 'PAYROLL_MANAGER'
  | 'ADMIN'
  | 'SUPER_ADMIN';

// Permission definitions with allowed roles
export const PERMISSIONS = {
  // Employee data access
  'employee:read:own': ['EMPLOYEE', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'employee:read:team': ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'employee:read:all': ['ADMIN', 'SUPER_ADMIN'],
  'employee:write': ['ADMIN', 'SUPER_ADMIN'],
  'employee:create': ['ADMIN', 'SUPER_ADMIN'],
  'employee:delete': ['SUPER_ADMIN'],

  // Salary/Payroll access
  'payroll:read:own': ['EMPLOYEE', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'payroll:read:all': ['PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'payroll:run': ['PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'payroll:approve': ['ADMIN', 'SUPER_ADMIN'],
  'payroll:export': ['PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],

  // Salary structure management
  'salary:read:own': ['EMPLOYEE', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'salary:read:all': ['PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'salary:write': ['ADMIN', 'SUPER_ADMIN'],

  // Leave management
  'leave:read:own': ['EMPLOYEE', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'leave:read:team': ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'leave:read:all': ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'leave:approve:team': ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'leave:approve:all': ['ADMIN', 'SUPER_ADMIN'],

  // Attendance
  'attendance:read:own': ['EMPLOYEE', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'attendance:read:all': ['HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'attendance:write': ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'attendance:lock': ['PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],

  // Document access
  'document:read:own': ['EMPLOYEE', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'document:read:all': ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'document:upload': ['EMPLOYEE', 'HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'document:delete': ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'],

  // Expense claims
  'expense:read:own': ['EMPLOYEE', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'expense:read:all': ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'expense:approve': ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'],

  // Loans
  'loan:read:own': ['EMPLOYEE', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'loan:read:all': ['HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'loan:approve': ['ADMIN', 'SUPER_ADMIN'],

  // Department/Designation management
  'org:read': ['EMPLOYEE', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'org:write': ['ADMIN', 'SUPER_ADMIN'],

  // Onboarding
  'onboarding:read': ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'onboarding:create': ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'onboarding:manage': ['ADMIN', 'SUPER_ADMIN'],

  // Admin functions
  'admin:settings': ['ADMIN', 'SUPER_ADMIN'],
  'admin:users': ['ADMIN', 'SUPER_ADMIN'],
  'admin:audit': ['SUPER_ADMIN'],
  'admin:mcp': ['SUPER_ADMIN'],

  // Reports
  'reports:basic': ['HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'reports:sensitive': ['ADMIN', 'SUPER_ADMIN'],
  'reports:export': ['ADMIN', 'SUPER_ADMIN'],

  // AI Assistant
  'ai:chat': ['EMPLOYEE', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'ai:tools': ['EMPLOYEE', 'HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'ai:admin_tools': ['ADMIN', 'SUPER_ADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    console.warn(`[RBAC] Unknown permission: ${permission}`);
    return false;
  }
  return (allowedRoles as readonly string[]).includes(role);
}

/**
 * Check if a session has a specific permission.
 */
export function sessionHasPermission(
  session: Session | null | undefined,
  permission: Permission
): boolean {
  if (!session?.user?.role) {
    return false;
  }
  return hasPermission(session.user.role, permission);
}

/**
 * Require a permission, throwing an error if not granted.
 * Use this in API routes and server actions.
 */
export function requirePermission(
  session: Session | null | undefined,
  permission: Permission
): void {
  if (!session?.user?.id) {
    throw new PermissionError('Authentication required', permission);
  }

  if (!hasPermission(session.user.role, permission)) {
    // Log the denial asynchronously (don't await)
    logPermissionDenied(
      'System',
      permission,
      permission,
      session.user.id
    ).catch(console.error);

    throw new PermissionError(
      `Permission denied: ${permission}`,
      permission,
      session.user.role
    );
  }
}

/**
 * Check multiple permissions (requires ALL).
 */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Check multiple permissions (requires ANY).
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role.
 */
export function getPermissionsForRole(role: string): Permission[] {
  return (Object.entries(PERMISSIONS) as [Permission, readonly UserRole[]][])
    .filter(([_, roles]) => roles.includes(role as UserRole))
    .map(([permission]) => permission);
}

/**
 * Check if user can access data belonging to another user.
 * Implements "own", "team", and "all" access patterns.
 */
export function canAccessResource(
  session: Session | null | undefined,
  resourceOwnerId: string,
  permissionPrefix: string // e.g., 'employee:read', 'payroll:read'
): boolean {
  if (!session?.user?.id) {
    return false;
  }

  const role = session.user.role;
  const userId = session.user.id;
  const employeeId = session.user.employeeId;

  // Check if accessing own data
  const isOwnData = 
    resourceOwnerId === userId || 
    resourceOwnerId === employeeId;

  if (isOwnData) {
    return hasPermission(role, `${permissionPrefix}:own` as Permission);
  }

  // Check "all" access
  if (hasPermission(role, `${permissionPrefix}:all` as Permission)) {
    return true;
  }

  // Could add team-based checks here if team relationships are tracked
  // For now, "team" permission is handled same as "all" for HR managers
  if (hasPermission(role, `${permissionPrefix}:team` as Permission)) {
    // In a full implementation, would check if resourceOwner is in user's team
    return true;
  }

  return false;
}

/**
 * Custom error class for permission denials.
 */
export class PermissionError extends Error {
  public readonly permission: Permission;
  public readonly role?: string;
  public readonly statusCode = 403;

  constructor(message: string, permission: Permission, role?: string) {
    super(message);
    this.name = 'PermissionError';
    this.permission = permission;
    this.role = role;
  }
}

/**
 * Check if error is a PermissionError.
 */
export function isPermissionError(error: unknown): error is PermissionError {
  return error instanceof PermissionError;
}

/**
 * Role hierarchy for comparison.
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  EMPLOYEE: 1,
  HR_MANAGER: 2,
  PAYROLL_MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

/**
 * Check if role A is higher or equal to role B in hierarchy.
 */
export function isRoleAtLeast(roleA: string, roleB: UserRole): boolean {
  const levelA = ROLE_HIERARCHY[roleA as UserRole] ?? 0;
  const levelB = ROLE_HIERARCHY[roleB] ?? 0;
  return levelA >= levelB;
}

/**
 * Get the highest role from a list.
 */
export function getHighestRole(roles: string[]): UserRole | null {
  if (roles.length === 0) return null;
  
  return roles.reduce((highest, current) => {
    const currentLevel = ROLE_HIERARCHY[current as UserRole] ?? 0;
    const highestLevel = ROLE_HIERARCHY[highest as UserRole] ?? 0;
    return currentLevel > highestLevel ? current : highest;
  }) as UserRole;
}
