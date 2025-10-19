// Security utilities for cross-app access prevention

import { getCurrentApp, hasAccessToApp } from './routing';
import type { UserRole } from './routing';

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  redirectUrl?: string;
}

/**
 * Check if a user has access to the current app based on their role
 */
export const checkAppAccess = (userRole: UserRole): SecurityCheckResult => {
  const currentApp = getCurrentApp();
  const hasAccess = hasAccessToApp(userRole, currentApp);

  if (!hasAccess) {
    return {
      allowed: false,
      reason: `User with role '${userRole}' does not have access to '${currentApp}' app`,
      redirectUrl: getRedirectUrlForRole(userRole)
    };
  }

  return { allowed: true };
};

/**
 * Get the appropriate redirect URL for a user role
 */
export const getRedirectUrlForRole = (userRole: UserRole): string => {
  if (['admin', 'coach'].includes(userRole)) {
    return process.env.NODE_ENV === 'production'
      ? 'https://o7c-hub-vercel-app.vercel.app'
      : 'http://localhost:3000';
  }
  if (['player', 'parent'].includes(userRole)) {
    return process.env.NODE_ENV === 'production'
      ? 'https://o7c-hub-player-portal-l9khcw4px-derrick-ls-projects.vercel.app'
      : 'http://localhost:3001';
  }
  return process.env.NODE_ENV === 'production'
    ? 'https://o7c-hub-player-portal-l9khcw4px-derrick-ls-projects.vercel.app'
    : 'http://localhost:3001';
};

/**
 * Validate API access based on user role and endpoint requirements
 */
export const validateApiAccess = (
  userRole: UserRole | undefined,
  requiredRoles: UserRole[],
  endpoint: string
): SecurityCheckResult => {
  if (!userRole) {
    return {
      allowed: false,
      reason: 'Authentication required'
    };
  }

  const hasAccess = requiredRoles.includes(userRole);

  if (!hasAccess) {
    return {
      allowed: false,
      reason: `User role '${userRole}' does not have access to endpoint '${endpoint}'. Required roles: ${requiredRoles.join(', ')}`
    };
  }

  return { allowed: true };
};

/**
 * Check if a user can perform a specific action on a resource
 */
export const canPerformAction = (
  userRole: UserRole | undefined,
  resource: string,
  action: string,
  context?: Record<string, any>
): SecurityCheckResult => {
  if (!userRole) {
    return {
      allowed: false,
      reason: 'Authentication required'
    };
  }

  // Define role-based permissions
  const permissions: Record<string, Record<string, UserRole[]>> = {
    'user-management': {
      'view': ['admin'],
      'create': ['admin'],
      'update': ['admin'],
      'delete': ['admin']
    },
    'roster': {
      'view': ['admin', 'coach'],
      'manage': ['admin', 'coach']
    },
    'recruiting': {
      'view': ['admin', 'coach', 'player', 'parent'],
      'manage': ['admin', 'coach']
    },
    'profile': {
      'view': ['admin', 'coach', 'player', 'parent'],
      'manage': ['admin', 'coach', 'player', 'parent']
    },
    'calendar': {
      'view': ['admin', 'coach', 'player', 'parent'],
      'manage': ['admin', 'coach']
    },
    'messages': {
      'view': ['admin', 'coach', 'player', 'parent'],
      'manage': ['admin', 'coach', 'player', 'parent']
    },
    'players': {
      'view': ['admin', 'coach', 'parent'],
      'manage': ['admin', 'coach', 'parent']
    }
  };

  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) {
    return {
      allowed: false,
      reason: `Unknown resource '${resource}'`
    };
  }

  const actionRoles = resourcePermissions[action];
  if (!actionRoles) {
    return {
      allowed: false,
      reason: `Unknown action '${action}' for resource '${resource}'`
    };
  }

  const hasPermission = actionRoles.includes(userRole);

  if (!hasPermission) {
    return {
      allowed: false,
      reason: `User role '${userRole}' does not have permission to '${action}' resource '${resource}'`
    };
  }

  return { allowed: true };
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Rate limiting helper (basic implementation)
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) { // 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}