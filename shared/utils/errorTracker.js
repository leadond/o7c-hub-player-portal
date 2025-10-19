/**
 * Error Tracking and Logging Utilities for Production Debugging
 * Provides centralized error logging, monitoring, and reporting capabilities
 */

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Error tracking configuration
 */
const ERROR_TRACKING_CONFIG = {
  // Maximum number of errors to store locally
  maxLocalErrors: 50,

  // Maximum age of errors to keep (in milliseconds)
  maxErrorAge: 24 * 60 * 60 * 1000, // 24 hours

  // Whether to send errors to external service in production
  enableExternalTracking: false,

  // External tracking service configuration (placeholder for Sentry, LogRocket, etc.)
  externalService: {
    dsn: process.env.REACT_APP_SENTRY_DSN || null,
    environment: process.env.NODE_ENV || 'development'
  }
};

/**
 * Enhanced error logger with categorization and context
 */
class ErrorTracker {
  constructor() {
    this.errors = [];
    this.isInitialized = false;
    this.sessionId = this.generateSessionId();

    this.initialize();
  }

  /**
   * Initialize error tracking
   */
  initialize() {
    if (this.isInitialized) return;

    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    // Clean up old errors periodically
    this.startCleanupInterval();

    this.isInitialized = true;
  }

  /**
   * Generate unique session ID for tracking
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set up global error handlers for unhandled errors
   */
  setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, {
        type: 'unhandled_promise_rejection',
        severity: ERROR_SEVERITY.HIGH,
        context: 'global'
      });
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(event.error || event.message, {
        type: 'javascript_error',
        severity: ERROR_SEVERITY.HIGH,
        context: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }

  /**
   * Start periodic cleanup of old errors
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupOldErrors();
    }, 60 * 60 * 1000); // Clean up every hour
  }

  /**
   * Track an error with enhanced context and categorization
   * @param {Error|string} error - The error to track
   * @param {Object} options - Tracking options
   */
  trackError(error, options = {}) {
    const errorInfo = this.processError(error, options);

    // Add to local storage
    this.addToLocalStorage(errorInfo);

    // Send to external service if configured
    if (ERROR_TRACKING_CONFIG.enableExternalTracking) {
      this.sendToExternalService(errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Tracked [${errorInfo.severity.toUpperCase()}]`);
      console.error('Error:', errorInfo.message);
      console.log('Context:', errorInfo.context);
      console.log('Full Info:', errorInfo);
      console.groupEnd();
    }

    return errorInfo.errorId;
  }

  /**
   * Process error into standardized format
   */
  processError(error, options) {
    const timestamp = new Date().toISOString();
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const errorInfo = {
      errorId,
      sessionId: this.sessionId,
      timestamp,
      message: error.message || error.toString(),
      stack: error.stack,
      name: error.name,
      type: options.type || 'unknown',
      severity: options.severity || ERROR_SEVERITY.MEDIUM,
      context: options.context || {},
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      userId: options.userId,
      component: options.component,
      action: options.action,
      metadata: options.metadata || {},
      handled: options.handled !== false,
      // Additional context
      ...options
    };

    return errorInfo;
  }

  /**
   * Add error to local storage for debugging
   */
  addToLocalStorage(errorInfo) {
    try {
      const errors = this.getStoredErrors();
      errors.unshift(errorInfo);

      // Keep only the most recent errors
      if (errors.length > ERROR_TRACKING_CONFIG.maxLocalErrors) {
        errors.splice(ERROR_TRACKING_CONFIG.maxLocalErrors);
      }

      localStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (storageError) {
      // Fallback if localStorage is not available
      console.warn('Failed to store error locally:', storageError);
    }
  }

  /**
   * Get stored errors from localStorage
   */
  getStoredErrors() {
    try {
      const stored = localStorage.getItem('app_errors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Send error to external tracking service
   */
  sendToExternalService(errorInfo) {
    // Placeholder for external error tracking service integration
    // Example integrations:
    // - Sentry: Sentry.captureException(error, { extra: errorInfo })
    // - LogRocket: LogRocket.captureException(error, { extra: errorInfo })
    // - Bugsnag: Bugsnag.notify(error, { context: errorInfo })

    if (ERROR_TRACKING_CONFIG.externalService.dsn) {
      // Send to Sentry or similar service
      console.log('Would send to external service:', errorInfo);
    }
  }

  /**
   * Clean up old errors from storage
   */
  cleanupOldErrors() {
    try {
      const errors = this.getStoredErrors();
      const cutoffTime = Date.now() - ERROR_TRACKING_CONFIG.maxErrorAge;

      const recentErrors = errors.filter(error => {
        const errorTime = new Date(error.timestamp).getTime();
        return errorTime > cutoffTime;
      });

      if (recentErrors.length !== errors.length) {
        localStorage.setItem('app_errors', JSON.stringify(recentErrors));
      }
    } catch (error) {
      console.warn('Failed to cleanup old errors:', error);
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats() {
    const errors = this.getStoredErrors();
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);

    const recentErrors = errors.filter(error => {
      const errorTime = new Date(error.timestamp).getTime();
      return errorTime > last24Hours;
    });

    const stats = {
      total: errors.length,
      last24Hours: recentErrors.length,
      bySeverity: {},
      byType: {},
      unhandledErrors: errors.filter(e => !e.handled).length
    };

    // Count by severity
    Object.values(ERROR_SEVERITY).forEach(severity => {
      stats.bySeverity[severity] = errors.filter(e => e.severity === severity).length;
    });

    // Count by type
    recentErrors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Export errors for debugging/support
   */
  exportErrors() {
    const errors = this.getStoredErrors();
    const exportData = {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      errors,
      stats: this.getErrorStats(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : ''
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Create singleton instance
export const errorTracker = new ErrorTracker();

/**
 * React hook for tracking errors in components
 */
export const useErrorTracker = () => {
  const trackError = React.useCallback((error, options = {}) => {
    return errorTracker.trackError(error, {
      context: 'react_component',
      ...options
    });
  }, []);

  const trackComponentError = React.useCallback((error, componentName, options = {}) => {
    return errorTracker.trackError(error, {
      context: 'react_component',
      component: componentName,
      ...options
    });
  }, []);

  return {
    trackError,
    trackComponentError,
    getErrorStats: errorTracker.getErrorStats.bind(errorTracker),
    exportErrors: errorTracker.exportErrors.bind(errorTracker)
  };
};

/**
 * Higher-order component for automatic error tracking
 */
export const withErrorTracking = (WrappedComponent, componentName) => {
  return function ErrorTrackedComponent(props) {
    const { trackComponentError } = useErrorTracker();

    React.useEffect(() => {
      const handleError = (error) => {
        trackComponentError(error, componentName, {
          severity: ERROR_SEVERITY.HIGH,
          handled: false
        });
      };

      // This is a simplified approach - in a real implementation,
      // you might want to use React Error Boundaries for this
      const originalErrorHandler = window.onerror;
      window.onerror = function(message, source, lineno, colno, error) {
        if (error) {
          handleError(error);
        }
        if (originalErrorHandler) {
          return originalErrorHandler(message, source, lineno, colno, error);
        }
      };

      return () => {
        window.onerror = originalErrorHandler;
      };
    }, [trackComponentError, componentName]);

    return <WrappedComponent {...props} />;
  };
};

// React import for hooks (this will be handled by the importing component)
import React from 'react';

export default errorTracker;