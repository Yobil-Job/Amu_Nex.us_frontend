/**
 * Role-based access control utilities
 * 
 * Role hierarchy (from backend):
 * - STUDENT: Regular user who registers
 * - SUPER_USER: Club admin (promoted by SUPER_ADMIN)
 * - SUPER_ADMIN: System admin (can create/delete clubs, manage all students)
 * - ADMIN: Master admin for the whole system
 */

export type UserRole = 'STUDENT' | 'SUPER_USER' | 'SUPER_ADMIN' | 'ADMIN';

/**
 * Check if user has a specific role
 */
export function hasRole(userRole: string | undefined | null, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return userRole.toUpperCase() === requiredRole.toUpperCase();
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRole: string | undefined | null, ...roles: UserRole[]): boolean {
  if (!userRole) return false;
  const upperUserRole = userRole.toUpperCase();
  return roles.some(role => upperUserRole === role.toUpperCase());
}

/**
 * Check if user is a SUPER_ADMIN
 */
export function isSuperAdmin(userRole: string | undefined | null): boolean {
  return hasRole(userRole, 'SUPER_ADMIN');
}

/**
 * Check if user is an ADMIN
 */
export function isAdmin(userRole: string | undefined | null): boolean {
  return hasRole(userRole, 'ADMIN');
}

/**
 * Check if user is a SUPER_USER (club admin)
 */
export function isSuperUser(userRole: string | undefined | null): boolean {
  return hasRole(userRole, 'SUPER_USER');
}

/**
 * Check if user is a STUDENT
 */
export function isStudent(userRole: string | undefined | null): boolean {
  return hasRole(userRole, 'STUDENT');
}

/**
 * Check if user is an admin (SUPER_ADMIN or ADMIN)
 */
export function isAnyAdmin(userRole: string | undefined | null): boolean {
  return hasAnyRole(userRole, 'SUPER_ADMIN', 'ADMIN');
}

/**
 * Check if user can manage clubs (SUPER_ADMIN or ADMIN)
 */
export function canManageClubs(userRole: string | undefined | null): boolean {
  return hasAnyRole(userRole, 'SUPER_ADMIN', 'ADMIN');
}

/**
 * Check if user can create clubs (SUPER_ADMIN only)
 */
export function canCreateClub(userRole: string | undefined | null): boolean {
  return isSuperAdmin(userRole);
}

/**
 * Check if user can delete clubs (SUPER_ADMIN only)
 */
export function canDeleteClub(userRole: string | undefined | null): boolean {
  return isSuperAdmin(userRole);
}

/**
 * Check if user can manage events (SUPER_ADMIN, ADMIN, or SUPER_USER)
 */
export function canManageEvents(userRole: string | undefined | null): boolean {
  return hasAnyRole(userRole, 'SUPER_ADMIN', 'ADMIN', 'SUPER_USER');
}

/**
 * Check if user can create events (SUPER_ADMIN, ADMIN, or SUPER_USER)
 */
export function canCreateEvent(userRole: string | undefined | null): boolean {
  return hasAnyRole(userRole, 'SUPER_ADMIN', 'ADMIN', 'SUPER_USER');
}

/**
 * Check if user can update/delete events (SUPER_ADMIN, ADMIN, or SUPER_USER)
 */
export function canUpdateEvent(userRole: string | undefined | null): boolean {
  return hasAnyRole(userRole, 'SUPER_ADMIN', 'ADMIN', 'SUPER_USER');
}

/**
 * Check if user can manage announcements (SUPER_ADMIN, ADMIN, or SUPER_USER)
 */
export function canManageAnnouncements(userRole: string | undefined | null): boolean {
  return hasAnyRole(userRole, 'SUPER_ADMIN', 'ADMIN', 'SUPER_USER');
}

/**
 * Check if user can approve/reject club requests (SUPER_ADMIN or ADMIN)
 */
export function canApproveRequests(userRole: string | undefined | null): boolean {
  return hasAnyRole(userRole, 'SUPER_ADMIN', 'ADMIN');
}

/**
 * Check if user can reject requests (ADMIN only - based on backend)
 */
export function canRejectRequests(userRole: string | undefined | null): boolean {
  return isAdmin(userRole);
}

/**
 * Check if user can view all students (SUPER_ADMIN only)
 */
export function canViewAllStudents(userRole: string | undefined | null): boolean {
  return isSuperAdmin(userRole);
}

/**
 * Check if user can assign club admin (SUPER_ADMIN only)
 */
export function canAssignClubAdmin(userRole: string | undefined | null): boolean {
  return isSuperAdmin(userRole);
}

/**
 * Check if user can manage authorities (SUPER_ADMIN or ADMIN)
 */
export function canManageAuthorities(userRole: string | undefined | null): boolean {
  return hasAnyRole(userRole, 'SUPER_ADMIN', 'ADMIN');
}

/**
 * Check if user can view club members (SUPER_ADMIN or ADMIN)
 */
export function canViewClubMembers(userRole: string | undefined | null): boolean {
  return hasAnyRole(userRole, 'SUPER_ADMIN', 'ADMIN');
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string | undefined | null): string {
  if (!role) return 'Student';
  
  const roleMap: Record<string, string> = {
    'STUDENT': 'Student',
    'SUPER_USER': 'Club Admin',
    'SUPER_ADMIN': 'System Admin',
    'ADMIN': 'Administrator',
  };
  
  return roleMap[role.toUpperCase()] || role;
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: string | undefined | null): string {
  if (!role) return 'bg-muted text-muted-foreground';
  
  const colorMap: Record<string, string> = {
    'STUDENT': 'bg-success/10 text-success',
    'SUPER_USER': 'bg-primary/10 text-primary',
    'SUPER_ADMIN': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    'ADMIN': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };
  
  return colorMap[role.toUpperCase()] || 'bg-muted text-muted-foreground';
}

