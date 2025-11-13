/**
 * Role-based access control utilities
 * 
 * Role hierarchy (from backend):
 * - STUDENT: Regular user who registers
 * - ADMIN: Club admin (assigned by SUPER_ADMIN, manages specific club(s))
 * - SUPER_ADMIN: System admin (can create/delete clubs, manage all students, assign club admins)
 * 
 * Important Notes:
 * - In backend enum, club admin role name is 'ADMIN' (exactly, no ROLE_ prefix)
 * - JWT token contains role as "ADMIN" exactly for club admin
 * - All roles are normalized to uppercase (ADMIN, STUDENT, SUPER_ADMIN, SUPER_USER)
 * - Role checks are case-insensitive for safety
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
 * Check if user is an ADMIN (Club Admin)
 * Note: In backend, ADMIN = Club Admin role
 */
export function isAdmin(userRole: string | undefined | null): boolean {
  return hasRole(userRole, 'ADMIN');
}

/**
 * Check if user is a Club Admin (alias for isAdmin for clarity)
 */
export function isClubAdmin(userRole: string | undefined | null): boolean {
  return isAdmin(userRole);
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
 * Check if user can view/manage club settings (ADMIN only - for their assigned clubs)
 */
export function canManageClubSettings(userRole: string | undefined | null): boolean {
  return isAdmin(userRole);
}

/**
 * Check if user can view join requests for their clubs (ADMIN only)
 */
export function canViewClubJoinRequests(userRole: string | undefined | null): boolean {
  return isAdmin(userRole);
}

/**
 * Check if user can view fees for their clubs (SUPER_ADMIN or ADMIN)
 */
export function canViewFees(userRole: string | undefined | null): boolean {
  return hasAnyRole(userRole, 'SUPER_ADMIN', 'ADMIN', 'STUDENT');
}

/**
 * Check if user can manage fees (SUPER_ADMIN or ADMIN)
 */
export function canManageFees(userRole: string | undefined | null): boolean {
  return hasAnyRole(userRole, 'SUPER_ADMIN', 'ADMIN');
}

/**
 * Check if user can view events for their clubs (all roles)
 */
export function canViewEvents(userRole: string | undefined | null): boolean {
  return true; // All authenticated users can view events
}

/**
 * Check if user can view announcements for their clubs (all roles)
 */
export function canViewAnnouncements(userRole: string | undefined | null): boolean {
  return true; // All authenticated users can view announcements
}

/**
 * Check if user has club admin privileges (can manage a specific club)
 */
export function hasClubAdminPrivileges(userRole: string | undefined | null): boolean {
  return isAdmin(userRole);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string | undefined | null): string {
  if (!role) return 'Student';
  
  const roleMap: Record<string, string> = {
    'STUDENT': 'Student',
    'ADMIN': 'Club Admin',
    'SUPER_USER': 'Authority',
    'SUPER_ADMIN': 'System Admin',
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
    'ADMIN': 'bg-primary/10 text-primary',
    'SUPER_USER': 'bg-accent/10 text-accent',
    'SUPER_ADMIN': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  };
  
  return colorMap[role.toUpperCase()] || 'bg-muted text-muted-foreground';
}

