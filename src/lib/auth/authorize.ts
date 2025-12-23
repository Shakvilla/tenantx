import { ForbiddenError } from '@/lib/errors'
import type { AuthContext } from './authenticate'

/**
 * User roles in order of privilege (lowest to highest).
 */
export enum UserRole {
  VIEWER = 'viewer',
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/**
 * Role hierarchy for permission comparison.
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.VIEWER]: 1,
  [UserRole.USER]: 2,
  [UserRole.MANAGER]: 3,
  [UserRole.ADMIN]: 4,
  [UserRole.SUPER_ADMIN]: 5,
}

/**
 * Checks if user has at least the required role.
 * 
 * @throws ForbiddenError if user lacks required role
 * 
 * @example
 * ```typescript
 * const auth = await authenticateRequest(request)
 * requireRole(auth, UserRole.ADMIN) // throws if not admin+
 * ```
 */
export function requireRole(auth: AuthContext, requiredRole: UserRole): void {
  const userRoleLevel = ROLE_HIERARCHY[auth.role as UserRole] || 0
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole]
  
  if (userRoleLevel < requiredRoleLevel) {
    throw new ForbiddenError(
      `This action requires ${requiredRole} role or higher`
    )
  }
}

/**
 * Checks if user has any of the specified roles.
 * 
 * @throws ForbiddenError if user lacks any of the required roles
 */
export function requireAnyRole(auth: AuthContext, roles: UserRole[]): void {
  if (!roles.includes(auth.role as UserRole)) {
    throw new ForbiddenError(
      `This action requires one of the following roles: ${roles.join(', ')}`
    )
  }
}

/**
 * Checks if user has access to the specified tenant.
 * 
 * @throws ForbiddenError if user cannot access tenant
 */
export function requireTenantAccess(auth: AuthContext, tenantId: string): void {
  // Super admins can access any tenant
  if (auth.role === UserRole.SUPER_ADMIN) {
    return
  }
  
  if (auth.tenantId !== tenantId) {
    throw ForbiddenError.tenantAccessDenied(tenantId)
  }
}

/**
 * Checks if user is the owner of a resource.
 * 
 * @throws ForbiddenError if user is not the owner
 */
export function requireOwnership(
  auth: AuthContext,
  resourceOwnerId: string,
  allowAdmins: boolean = true
): void {
  // Admins can bypass ownership check if allowed
  if (allowAdmins && isAdmin(auth)) {
    return
  }
  
  if (auth.user.id !== resourceOwnerId) {
    throw new ForbiddenError('You can only modify your own resources')
  }
}

/**
 * Checks if user is an admin or higher.
 */
export function isAdmin(auth: AuthContext): boolean {
  return (
    auth.role === UserRole.ADMIN ||
    auth.role === UserRole.SUPER_ADMIN
  )
}

/**
 * Checks if user is a super admin.
 */
export function isSuperAdmin(auth: AuthContext): boolean {
  return auth.role === UserRole.SUPER_ADMIN
}
