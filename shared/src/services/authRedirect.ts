// Authentication redirect service for seamless app transitions

import { getRedirectUrl, shouldRedirectUser, getCurrentApp } from '../utils/routing';
import type { UserRole } from '../utils/routing';

export interface RedirectOptions {
  preserveQuery?: boolean;
  preserveHash?: boolean;
  delay?: number;
}

export class AuthRedirectService {
  private static instance: AuthRedirectService;

  private constructor() {}

  static getInstance(): AuthRedirectService {
    if (!AuthRedirectService.instance) {
      AuthRedirectService.instance = new AuthRedirectService();
    }
    return AuthRedirectService.instance;
  }

  /**
   * Redirect user to their appropriate app based on role
   */
  redirectByRole(userRole: UserRole, options: RedirectOptions = {}): void {
    if (!shouldRedirectUser(userRole)) {
      return; // User is already in the correct app
    }

    const redirectUrl = getRedirectUrl(userRole);
    this.performRedirect(redirectUrl, options);
  }

  /**
   * Redirect to a specific app
   */
  redirectToApp(appKey: 'o7c-hub' | 'player-portal', options: RedirectOptions = {}): void {
    const currentApp = getCurrentApp();
    if (currentApp === appKey) {
      return; // Already in the target app
    }

    const baseUrl = appKey === 'o7c-hub'
      ? (process.env.NODE_ENV === 'production' ? 'https://o7c-hub.vercel.app' : 'http://localhost:3000')
      : (process.env.NODE_ENV === 'production' ? 'https://player-portal.vercel.app' : 'http://localhost:3001');

    this.performRedirect(baseUrl, options);
  }

  /**
   * Perform the actual redirect with options
   */
  private performRedirect(url: string, options: RedirectOptions): void {
    const { preserveQuery = true, preserveHash = true, delay = 0 } = options;

    let finalUrl = url;

    if (preserveQuery && window.location.search) {
      const urlObj = new URL(url);
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.forEach((value, key) => {
        if (!urlObj.searchParams.has(key)) {
          urlObj.searchParams.set(key, value);
        }
      });
      finalUrl = urlObj.toString();
    }

    if (preserveHash && window.location.hash) {
      finalUrl += window.location.hash;
    }

    if (delay > 0) {
      setTimeout(() => {
        window.location.href = finalUrl;
      }, delay);
    } else {
      window.location.href = finalUrl;
    }
  }

  /**
   * Check if current user should be redirected and perform redirect if needed
   */
  checkAndRedirect(userRole: UserRole, options: RedirectOptions = {}): boolean {
    if (shouldRedirectUser(userRole)) {
      this.redirectByRole(userRole, options);
      return true;
    }
    return false;
  }

  /**
   * Get the URL for a specific role without performing redirect
   */
  getRoleUrl(userRole: UserRole): string {
    return getRedirectUrl(userRole);
  }

  /**
   * Get the URL for a specific app without performing redirect
   */
  getAppUrl(appKey: 'o7c-hub' | 'player-portal'): string {
    return appKey === 'o7c-hub'
      ? (process.env.NODE_ENV === 'production' ? 'https://o7c-hub.vercel.app' : 'http://localhost:3000')
      : (process.env.NODE_ENV === 'production' ? 'https://player-portal.vercel.app' : 'http://localhost:3001');
  }
}

// Export singleton instance
export const authRedirect = AuthRedirectService.getInstance();