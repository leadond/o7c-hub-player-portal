// Authentication middleware for API endpoints

import type { UserRole } from '../utils/routing';

export interface AuthenticatedRequest {
  user?: {
    uid: string;
    email: string;
    role: UserRole;
  };
  body: any;
  query: any;
  params: any;
}

export interface AuthMiddlewareOptions {
  requiredRoles?: UserRole[];
  requireAllRoles?: boolean;
  requiredPermissions?: Array<{ resource: string; action: string }>;
  requireAllPermissions?: boolean;
}

export const createAuthMiddleware = (options: AuthMiddlewareOptions = {}) => {
  return (req: AuthenticatedRequest, res: any, next: any) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be logged in to access this resource'
        });
      }

      // Check role requirements
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        const hasRequiredRole = options.requireAllRoles
          ? options.requiredRoles.every(role => req.user!.role === role)
          : options.requiredRoles.includes(req.user!.role);

        if (!hasRequiredRole) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            message: 'Your role does not have access to this resource'
          });
        }
      }

      // Check permission requirements (if implemented)
      if (options.requiredPermissions && options.requiredPermissions.length > 0) {
        // This would integrate with the permission checking utilities
        // For now, we'll assume permissions are checked at the application level
        console.warn('Permission checking not yet implemented in middleware');
      }

      // User is authorized, continue to next middleware/route handler
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred while checking authentication'
      });
    }
  };
};

// Convenience middleware functions for common use cases
export const requireAdmin = createAuthMiddleware({ requiredRoles: ['admin'] });
export const requireCoach = createAuthMiddleware({ requiredRoles: ['admin', 'coach'] });
export const requirePlayer = createAuthMiddleware({ requiredRoles: ['player', 'parent'] });
export const requireParent = createAuthMiddleware({ requiredRoles: ['parent'] });
export const requireAuthenticated = createAuthMiddleware();