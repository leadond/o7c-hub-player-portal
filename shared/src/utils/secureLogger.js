/**
 * Secure Logger Utility
 * Provides secure logging functions that automatically sanitize sensitive information
 */

import { sanitizeErrorMessage, sanitizeTokenForLogging } from './tokenValidation.js';

/**
 * Log levels for different types of messages
 */
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Sensitive data patterns to sanitize from logs
 */
const SENSITIVE_PATTERNS = [
  // API Keys and tokens
  { pattern: /hf_[a-zA-Z0-9]{34}/g, replacement: '[HF_TOKEN_REDACTED]' },
  { pattern: /xkeysib-[a-f0-9]{64}-[a-zA-Z0-9]{16}/g, replacement: '[BREVO_TOKEN_REDACTED]' },
  { pattern: /Bearer\s+[a-zA-Z0-9._-]+/gi, replacement: 'Bearer [TOKEN_REDACTED]' },
  { pattern: /Authorization:\s*[^\s,]+/gi, replacement: 'Authorization: [TOKEN_REDACTED]' },
  
  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
  
  // Phone numbers (US format)
  { pattern: /\b\d{3}-\d{3}-\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
  { pattern: /\b\(\d{3}\)\s*\d{3}-\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
  
  // Credit card numbers (basic pattern)
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD_REDACTED]' },
  
  // Social Security Numbers
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
  
  // IP Addresses (optional - might be needed for debugging)
  // { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP_REDACTED]' },
  
  // Passwords in URLs or form data
  { pattern: /password[=:]\s*[^\s&]+/gi, replacement: 'password=[PASSWORD_REDACTED]' },
  { pattern: /pwd[=:]\s*[^\s&]+/gi, replacement: 'pwd=[PASSWORD_REDACTED]' },
  
  // Generic long alphanumeric strings that might be tokens (32+ chars)
  { pattern: /\b[a-zA-Z0-9]{32,}\b/g, replacement: '[POTENTIAL_TOKEN_REDACTED]' }
];

/**
 * Sanitizes a message by removing or masking sensitive information
 * @param {any} message - The message to sanitize (string, object, or other)
 * @returns {any} Sanitized message
 */
function sanitizeMessage(message) {
  if (typeof message === 'string') {
    let sanitized = message;
    
    // Apply all sensitive data patterns
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, replacement);
    }
    
    return sanitized;
  }
  
  if (typeof message === 'object' && message !== null) {
    if (Array.isArray(message)) {
      return message.map(item => sanitizeMessage(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(message)) {
      // Sanitize both keys and values
      const sanitizedKey = sanitizeMessage(key);
      const sanitizedValue = sanitizeMessage(value);
      sanitized[sanitizedKey] = sanitizedValue;
    }
    return sanitized;
  }
  
  // For other types (numbers, booleans, etc.), return as-is
  return message;
}

/**
 * Creates a structured log entry with metadata
 * @param {string} level - Log level
 * @param {string} component - Component or module name
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Structured log entry
 */
function createLogEntry(level, component, message, metadata = {}) {
  return {
    timestamp: new Date().toISOString(),
    level: level,
    component: component,
    message: sanitizeMessage(message),
    metadata: sanitizeMessage(metadata),
    environment: process.env.NODE_ENV || 'development'
  };
}

/**
 * Secure logger class with automatic sanitization
 */
class SecureLogger {
  constructor(component) {
    this.component = component;
  }

  /**
   * Logs an error message with automatic sanitization
   * @param {string} message - Error message
   * @param {Object} metadata - Additional error metadata
   */
  error(message, metadata = {}) {
    const logEntry = createLogEntry(LOG_LEVELS.ERROR, this.component, message, metadata);
    console.error(`[${logEntry.component}] ERROR:`, logEntry.message, logEntry.metadata);
  }

  /**
   * Logs a warning message with automatic sanitization
   * @param {string} message - Warning message
   * @param {Object} metadata - Additional warning metadata
   */
  warn(message, metadata = {}) {
    const logEntry = createLogEntry(LOG_LEVELS.WARN, this.component, message, metadata);
    console.warn(`[${logEntry.component}] WARN:`, logEntry.message, logEntry.metadata);
  }

  /**
   * Logs an info message with automatic sanitization
   * @param {string} message - Info message
   * @param {Object} metadata - Additional info metadata
   */
  info(message, metadata = {}) {
    const logEntry = createLogEntry(LOG_LEVELS.INFO, this.component, message, metadata);
    console.log(`[${logEntry.component}] INFO:`, logEntry.message, logEntry.metadata);
  }

  /**
   * Logs a debug message with automatic sanitization (only in development)
   * @param {string} message - Debug message
   * @param {Object} metadata - Additional debug metadata
   */
  debug(message, metadata = {}) {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = createLogEntry(LOG_LEVELS.DEBUG, this.component, message, metadata);
      console.debug(`[${logEntry.component}] DEBUG:`, logEntry.message, logEntry.metadata);
    }
  }

  /**
   * Logs authentication-related events with enhanced security
   * @param {string} event - Authentication event type
   * @param {Object} details - Event details (will be sanitized)
   */
  authEvent(event, details = {}) {
    const sanitizedDetails = {
      ...sanitizeMessage(details),
      // Ensure tokens are properly sanitized
      token: details.token ? sanitizeTokenForLogging(details.token, details.service || 'unknown') : undefined
    };
    
    this.info(`Authentication event: ${event}`, sanitizedDetails);
  }

  /**
   * Logs API request/response with automatic sanitization
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {number} status - Response status
   * @param {Object} metadata - Additional request metadata
   */
  apiCall(method, url, status, metadata = {}) {
    const sanitizedUrl = sanitizeMessage(url);
    const sanitizedMetadata = sanitizeMessage(metadata);
    
    const logLevel = status >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
    const message = `${method} ${sanitizedUrl} - ${status}`;
    
    if (logLevel === LOG_LEVELS.ERROR) {
      this.error(message, sanitizedMetadata);
    } else {
      this.info(message, sanitizedMetadata);
    }
  }

  /**
   * Logs performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional performance metadata
   */
  performance(operation, duration, metadata = {}) {
    this.info(`Performance: ${operation} completed in ${duration}ms`, sanitizeMessage(metadata));
  }

  /**
   * Logs security events with enhanced detail
   * @param {string} event - Security event type
   * @param {Object} details - Event details
   */
  security(event, details = {}) {
    const sanitizedDetails = sanitizeMessage(details);
    this.warn(`Security event: ${event}`, sanitizedDetails);
  }
}

/**
 * Creates a secure logger instance for a component
 * @param {string} component - Component or module name
 * @returns {SecureLogger} Logger instance
 */
export function createSecureLogger(component) {
  return new SecureLogger(component);
}

/**
 * Global secure logging functions for backward compatibility
 */
export const secureLog = {
  error: (component, message, metadata) => {
    const logger = createSecureLogger(component);
    logger.error(message, metadata);
  },
  
  warn: (component, message, metadata) => {
    const logger = createSecureLogger(component);
    logger.warn(message, metadata);
  },
  
  info: (component, message, metadata) => {
    const logger = createSecureLogger(component);
    logger.info(message, metadata);
  },
  
  debug: (component, message, metadata) => {
    const logger = createSecureLogger(component);
    logger.debug(message, metadata);
  },
  
  authEvent: (component, event, details) => {
    const logger = createSecureLogger(component);
    logger.authEvent(event, details);
  },
  
  apiCall: (component, method, url, status, metadata) => {
    const logger = createSecureLogger(component);
    logger.apiCall(method, url, status, metadata);
  },
  
  performance: (component, operation, duration, metadata) => {
    const logger = createSecureLogger(component);
    logger.performance(operation, duration, metadata);
  },
  
  security: (component, event, details) => {
    const logger = createSecureLogger(component);
    logger.security(event, details);
  }
};

/**
 * Sanitizes any data for safe logging (utility function)
 * @param {any} data - Data to sanitize
 * @returns {any} Sanitized data
 */
export function sanitizeForLogging(data) {
  return sanitizeMessage(data);
}

export default {
  createSecureLogger,
  secureLog,
  sanitizeForLogging,
  LOG_LEVELS
};