// Main entry point for @o7c/shared package

// Authentication
export { AuthProvider, useAuth } from './contexts/AuthContext';

// Firebase configuration
export { auth, db, analytics } from './lib/firebase';

// Essential UI Components only
export { Button } from './components/ui/button';
export { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

// Core components
export * from './components';

// API clients and utilities
export * from './api';

// Utilities
export * from './utils';

// Services
export * from './services';

// Middleware
export * from './middleware';

// Hooks
export * from './hooks';

// Types
export type { User, UserData } from './types/auth';
export type { ApiResponse, ApiError } from './types/api';