// Permission checking utilities for role-based access control

import type { UserRole } from './routing';

export interface PermissionCheck {
  resource: string;
  action: string;
  roles: UserRole[];
}

export const PERMISSIONS: PermissionCheck[] = [
  // O7C Hub permissions (admin/coach)
  { resource: 'dashboard', action: 'view', roles: ['admin', 'coach'] },
  { resource: 'roster', action: 'view', roles: ['admin', 'coach'] },
  { resource: 'roster', action: 'manage', roles: ['admin', 'coach'] },
  { resource: 'recruiting', action: 'view', roles: ['admin', 'coach'] },
  { resource: 'recruiting', action: 'manage', roles: ['admin', 'coach'] },
  { resource: 'users', action: 'view', roles: ['admin'] },
  { resource: 'users', action: 'manage', roles: ['admin'] },

  // Player Portal permissions (player/parent)
  { resource: 'profile', action: 'view', roles: ['player', 'parent'] },
  { resource: 'profile', action: 'manage', roles: ['player', 'parent'] },
  { resource: 'recruiting', action: 'view', roles: ['player', 'parent'] },
  { resource: 'calendar', action: 'view', roles: ['player', 'parent'] },
  { resource: 'messages', action: 'view', roles: ['player', 'parent'] },
  { resource: 'messages', action: 'manage', roles: ['player', 'parent'] },
  { resource: 'players', action: 'view', roles: ['parent'] },
  { resource: 'players', action: 'manage', roles: ['parent'] },
];

export const hasPermission = (
  userRole: UserRole | undefined,
  resource: string,
  action: string
): boolean => {
  if (!userRole) return false;

  return PERMISSIONS.some(
    permission =>
      permission.resource === resource &&
      permission.action === action &&
      permission.roles.includes(userRole)
  );
};

export const hasAnyPermission = (
  userRole: UserRole | undefined,
  permissions: Array<{ resource: string; action: string }>
): boolean => {
  if (!userRole) return false;

  return permissions.some(({ resource, action }) =>
    hasPermission(userRole, resource, action)
  );
};

export const hasAllPermissions = (
  userRole: UserRole | undefined,
  permissions: Array<{ resource: string; action: string }>
): boolean => {
  if (!userRole) return false;

  return permissions.every(({ resource, action }) =>
    hasPermission(userRole, resource, action)
  );
};

export const getAllowedRoles = (resource: string, action: string): UserRole[] => {
  return PERMISSIONS
    .filter(permission => permission.resource === resource && permission.action === action)
    .flatMap(permission => permission.roles);
};