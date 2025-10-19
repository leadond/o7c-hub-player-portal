/**
 * Enhanced Error Handling Utilities for API failures and network issues
 * Provides user-friendly error messages and fallback handling
 */

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  API: 'API',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  UNKNOWN: 'UNKNOWN'
};

/**
 * HTTP status code mappings to error types
 */
const STATUS_ERROR_MAP = {
  400: ERROR_TYPES.VALIDATION,
  401: ERROR_TYPES.AUTHENTICATION,
  403: ERROR_TYPES.AUTHORIZATION,
  404: ERROR_TYPES.API,
  422: ERROR_TYPES.VALIDATION,
  429: ERROR_TYPES.API,
  500: ERROR_TYPES.SERVER,
  502: ERROR_TYPES.SERVER,
  503: ERROR_TYPES.SERVER,
  504: ERROR_TYPES.SERVER
};

/**
 * Network error patterns
 */
const NETWORK_ERRORS = [
  'NetworkError',
  'TypeError',
  'fetch',
  'network',
  'timeout',
  'ECONNRESET',
  'ENOTFOUND',
  'ECONNREFUSED'
];

/**
 * Categorizes an error based on its type and message
 * @param {Error} error - The error to categorize
 * @param {number} status - HTTP status code if available
 * @returns {string} - Error type from ERROR_TYPES
 */
export function categorizeError(error, status) {
  // If status code is provided, use it for categorization
  if (status && STATUS_ERROR_MAP[status]) {
    return STATUS_ERROR_MAP[status];
  }

  // Check for network-related errors
  if (error && typeof error.message === 'string') {
    const message = error.message.toLowerCase();
    if (NETWORK_ERRORS.some(pattern => message.includes(pattern.toLowerCase()))) {
      return ERROR_TYPES.NETWORK;
    }
  }

  // Check for authentication/authorization errors
  if (error && error.message) {
    const message = error.message.toLowerCase();
    if (message.includes('unauthorized') || message.includes('invalid token')) {
      return ERROR_TYPES.AUTHENTICATION;
    }
    if (message.includes('forbidden') || message.includes('access denied')) {
      return ERROR_TYPES.AUTHORIZATION;
    }
  }

  // Default to API error for API-related issues
  if (error && (error.name === 'ApiError' || error.status)) {
    return ERROR_TYPES.API;
  }

  return ERROR_TYPES.UNKNOWN;
}

/**
 * Gets user-friendly error message based on error type
 * @param {string} errorType - The categorized error type
 * @param {string} originalMessage - Original error message for context
 * @returns {string} - User-friendly error message
 */
export function getUserFriendlyMessage(errorType, originalMessage = '') {
  const messages = {
    [ERROR_TYPES.NETWORK]: 'Unable to connect to the server. Please check your internet connection and try again.',
    [ERROR_TYPES.API]: 'The service is temporarily unavailable. Please try again in a few moments.',
    [ERROR_TYPES.AUTHENTICATION]: 'Your session has expired. Please sign in again.',
    [ERROR_TYPES.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
    [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
    [ERROR_TYPES.SERVER]: 'The server is experiencing issues. Please try again later.',
    [ERROR_TYPES.CLIENT]: 'Something went wrong on our end. Please try again.',
    [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again or contact support if the issue persists.'
  };

  return messages[errorType] || messages[ERROR_TYPES.UNKNOWN];
}

/**
 * Gets appropriate fallback actions for different error types
 * @param {string} errorType - The categorized error type
 * @returns {Array} - Array of fallback action objects
 */
export function getFallbackActions(errorType) {
  const actions = {
    [ERROR_TYPES.NETWORK]: [
      { label: 'Retry', action: 'retry', primary: true },
      { label: 'Check Connection', action: 'checkConnection' }
    ],
    [ERROR_TYPES.API]: [
      { label: 'Try Again', action: 'retry', primary: true },
      { label: 'Refresh Page', action: 'refresh' }
    ],
    [ERROR_TYPES.AUTHENTICATION]: [
      { label: 'Sign In', action: 'login', primary: true },
      { label: 'Go Home', action: 'home' }
    ],
    [ERROR_TYPES.AUTHORIZATION]: [
      { label: 'Go Back', action: 'back', primary: true },
      { label: 'Contact Support', action: 'support' }
    ],
    [ERROR_TYPES.VALIDATION]: [
      { label: 'Fix Errors', action: 'fix', primary: true },
      { label: 'Reset Form', action: 'reset' }
    ],
    [ERROR_TYPES.SERVER]: [
      { label: 'Try Again', action: 'retry', primary: true },
      { label: 'Contact Support', action: 'support' }
    ],
    [ERROR_TYPES.CLIENT]: [
      { label: 'Refresh Page', action: 'refresh', primary: true },
      { label: 'Clear Cache', action: 'clearCache' }
    ],
    [ERROR_TYPES.UNKNOWN]: [
      { label: 'Try Again', action: 'retry', primary: true },
      { label: 'Contact Support', action: 'support' }
    ]
  };

  return actions[errorType] || actions[ERROR_TYPES.UNKNOWN];
}

/**
 * Enhanced error handler for API calls
 * @param {Error} error - The error that occurred
 * @param {Object} context - Additional context (component, action, etc.)
 * @returns {Object} - Processed error information
 */
export function handleApiError(error, context = {}) {
  const errorType = categorizeError(error, error.status);
  const userMessage = getUserFriendlyMessage(errorType, error.message);
  const fallbackActions = getFallbackActions(errorType);

  // Log error for debugging/monitoring
  const errorInfo = {
    type: errorType,
    message: error.message,
    stack: error.stack,
    status: error.status,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    url: typeof window !== 'undefined' ? window.location.href : ''
  };

  console.error('API Error:', errorInfo);

  // Store error for debugging (in production, send to error tracking service)
  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    const errors = JSON.parse(sessionStorage.getItem('app_errors') || '[]');
    errors.push(errorInfo);
    // Keep only last 20 errors
    if (errors.length > 20) {
      errors.splice(0, errors.length - 20);
    }
    sessionStorage.setItem('app_errors', JSON.stringify(errors));
  }

  return {
    type: errorType,
    message: userMessage,
    originalError: error,
    actions: fallbackActions,
    canRetry: [ERROR_TYPES.NETWORK, ERROR_TYPES.API, ERROR_TYPES.SERVER].includes(errorType),
    shouldLogout: errorType === ERROR_TYPES.AUTHENTICATION,
    errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * Retry wrapper for API calls with exponential backoff
 * @param {Function} apiCall - The API function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {Object} context - Context for error handling
 * @returns {Promise} - The API call result or throws handled error
 */
export async function withRetry(apiCall, maxRetries = 3, baseDelay = 1000, context = {}) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Don't retry client errors (4xx except 429)
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw handleApiError(error, context);
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw handleApiError(lastError, context);
}

/**
 * Hook for handling async operations with error states
 * @param {Function} asyncOperation - The async operation to handle
 * @param {Object} options - Options for error handling
 * @returns {Object} - State and handlers for the operation
 */
export function useAsyncErrorHandler(asyncOperation, options = {}) {
  const [state, setState] = React.useState({
    loading: false,
    error: null,
    data: null,
    lastError: null
  });

  const execute = React.useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await asyncOperation(...args);
      setState(prev => ({
        ...prev,
        loading: false,
        data: result,
        error: null
      }));
      return result;
    } catch (error) {
      const handledError = handleApiError(error, options.context);
      setState(prev => ({
        ...prev,
        loading: false,
        error: handledError,
        lastError: error
      }));
      throw handledError;
    }
  }, [asyncOperation, options.context]);

  const retry = React.useCallback(() => {
    if (state.lastError) {
      return execute();
    }
  }, [execute, state.lastError]);

  return {
    ...state,
    execute,
    retry,
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
}

// React import for hooks (this will be handled by the importing component)
import React from 'react';

export default {
  ERROR_TYPES,
  categorizeError,
  getUserFriendlyMessage,
  getFallbackActions,
  handleApiError,
  withRetry,
  useAsyncErrorHandler
};