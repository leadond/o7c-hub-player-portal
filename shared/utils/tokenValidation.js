/**
 * Token Validation Utility
 * Provides comprehensive token validation and security functions
 */

/**
 * Token validation patterns for different services
 */
const TOKEN_PATTERNS = {
  huggingface: {
    pattern: /^hf_[a-zA-Z0-9]{34}$/,
    description: 'HuggingFace API token (starts with "hf_" followed by 34 alphanumeric characters)',
    example: 'hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  },
  base44: {
    pattern: /^[a-zA-Z0-9]{32,}$/,
    description: 'Base44 API key (32+ alphanumeric characters)',
    example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  },
  brevo: {
    pattern: /^xkeysib-[a-f0-9]{64}-[a-zA-Z0-9]{16}$/,
    description: 'Brevo API key (starts with "xkeysib-" followed by hex and alphanumeric)',
    example: 'xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx'
  }
};

/**
 * Validates token format for a specific service
 * @param {string} token - The token to validate
 * @param {string} service - The service type ('huggingface', 'base44', 'brevo')
 * @returns {Object} Validation result with success, error details, and suggestions
 */
export function validateTokenFormat(token, service) {
  // Input validation
  if (!token) {
    return {
      valid: false,
      error: 'TOKEN_MISSING',
      message: 'Token is required but not provided',
      suggestions: [
        'Ensure the token is set in your environment variables',
        'Check for typos in the environment variable name',
        'Verify the token is not empty or undefined'
      ]
    };
  }

  if (typeof token !== 'string') {
    return {
      valid: false,
      error: 'TOKEN_INVALID_TYPE',
      message: `Token must be a string, received ${typeof token}`,
      suggestions: [
        'Ensure the token is stored as a string value',
        'Check for accidental type conversion in your code'
      ]
    };
  }

  // Trim whitespace and check for empty string
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return {
      valid: false,
      error: 'TOKEN_EMPTY',
      message: 'Token is empty or contains only whitespace',
      suggestions: [
        'Remove any leading/trailing spaces from the token',
        'Ensure the token value is not just whitespace',
        'Check the source of the token for formatting issues'
      ]
    };
  }

  // Service validation
  const serviceConfig = TOKEN_PATTERNS[service];
  if (!serviceConfig) {
    return {
      valid: false,
      error: 'UNKNOWN_SERVICE',
      message: `Unknown service type: ${service}`,
      suggestions: [
        `Supported services: ${Object.keys(TOKEN_PATTERNS).join(', ')}`,
        'Check the service parameter for typos'
      ]
    };
  }

  // Pattern validation
  if (!serviceConfig.pattern.test(trimmedToken)) {
    return {
      valid: false,
      error: 'TOKEN_INVALID_FORMAT',
      message: `Invalid ${service} token format`,
      expectedFormat: serviceConfig.description,
      example: serviceConfig.example,
      actualLength: trimmedToken.length,
      suggestions: [
        `Expected format: ${serviceConfig.description}`,
        `Example: ${serviceConfig.example}`,
        'Verify you copied the complete token without truncation',
        'Check for extra characters or missing parts',
        'Generate a new token if the current one appears corrupted'
      ]
    };
  }

  // Additional security checks
  const securityIssues = [];
  
  // Check for common placeholder values
  const placeholders = [
    'your_token_here',
    'replace_with_token',
    'token_placeholder',
    'xxx',
    'yyy',
    'zzz',
    'example',
    'sample',
    'test',
    'demo'
  ];
  
  if (placeholders.some(placeholder => 
    trimmedToken.toLowerCase().includes(placeholder.toLowerCase())
  )) {
    securityIssues.push({
      type: 'PLACEHOLDER_VALUE',
      message: 'Token appears to be a placeholder value',
      suggestion: 'Replace with an actual API token from the service provider'
    });
  }

  // Check for repeated characters (potential dummy token)
  if (/(.)\1{10,}/.test(trimmedToken)) {
    securityIssues.push({
      type: 'REPEATED_CHARACTERS',
      message: 'Token contains many repeated characters',
      suggestion: 'Ensure this is a real token and not a placeholder'
    });
  }

  // Success with optional security warnings
  return {
    valid: true,
    token: trimmedToken,
    service: service,
    format: serviceConfig.description,
    securityIssues: securityIssues.length > 0 ? securityIssues : undefined,
    validatedAt: new Date().toISOString()
  };
}

/**
 * Validates multiple tokens at once
 * @param {Object} tokens - Object with service names as keys and tokens as values
 * @returns {Object} Validation results for all tokens
 */
export function validateMultipleTokens(tokens) {
  const results = {};
  const errors = [];
  let allValid = true;

  for (const [service, token] of Object.entries(tokens)) {
    const result = validateTokenFormat(token, service);
    results[service] = result;
    
    if (!result.valid) {
      allValid = false;
      errors.push({
        service,
        ...result
      });
    }
  }

  return {
    allValid,
    results,
    errors,
    summary: {
      total: Object.keys(tokens).length,
      valid: Object.values(results).filter(r => r.valid).length,
      invalid: errors.length
    }
  };
}

/**
 * Sanitizes a token for logging (replaces with safe placeholder)
 * @param {string} token - The token to sanitize
 * @param {string} service - The service type for context
 * @returns {string} Sanitized token safe for logging
 */
export function sanitizeTokenForLogging(token, service = 'unknown') {
  if (!token || typeof token !== 'string') {
    return '[INVALID_TOKEN]';
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return '[EMPTY_TOKEN]';
  }

  // Show first 3 and last 3 characters for debugging while hiding the middle
  if (trimmed.length > 10) {
    const prefix = trimmed.substring(0, 3);
    const suffix = trimmed.substring(trimmed.length - 3);
    return `${prefix}***[${service.toUpperCase()}_TOKEN_REDACTED]***${suffix}`;
  }

  // For shorter tokens, just show the service type
  return `[${service.toUpperCase()}_TOKEN_REDACTED]`;
}

/**
 * Sanitizes error messages to remove any token information
 * @param {string} message - The error message to sanitize
 * @returns {string} Sanitized error message
 */
export function sanitizeErrorMessage(message) {
  if (!message || typeof message !== 'string') {
    return message;
  }

  // Remove HuggingFace tokens
  let sanitized = message.replace(/hf_[a-zA-Z0-9]{34}/g, '[HF_TOKEN_REDACTED]');
  
  // Remove Brevo tokens
  sanitized = sanitized.replace(/xkeysib-[a-f0-9]{64}-[a-zA-Z0-9]{16}/g, '[BREVO_TOKEN_REDACTED]');
  
  // Remove potential Base44 tokens (32+ alphanumeric strings that might be tokens)
  sanitized = sanitized.replace(/\b[a-zA-Z0-9]{32,}\b/g, '[POTENTIAL_TOKEN_REDACTED]');
  
  // Remove Bearer tokens
  sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [TOKEN_REDACTED]');
  
  // Remove Authorization headers
  sanitized = sanitized.replace(/Authorization:\s*[^\s,]+/gi, 'Authorization: [TOKEN_REDACTED]');
  
  return sanitized;
}

/**
 * Checks if a token is likely expired based on common error patterns
 * @param {string} errorMessage - Error message from API response
 * @returns {boolean} True if token appears to be expired
 */
export function isTokenExpired(errorMessage) {
  if (!errorMessage || typeof errorMessage !== 'string') {
    return false;
  }

  const expiredPatterns = [
    /token.*expired/i,
    /expired.*token/i,
    /token.*invalid/i,
    /invalid.*token/i,
    /unauthorized/i,
    /authentication.*failed/i,
    /access.*denied/i,
    /forbidden/i,
    /401/,
    /403/
  ];

  return expiredPatterns.some(pattern => pattern.test(errorMessage));
}

/**
 * Generates troubleshooting steps for token validation failures
 * @param {Object} validationResult - Result from validateTokenFormat
 * @param {string} service - The service type
 * @returns {Object} Troubleshooting information
 */
export function generateTokenTroubleshooting(validationResult, service) {
  const baseSteps = [
    'Verify you have the correct API token for the service',
    'Check that the token was copied completely without truncation',
    'Ensure there are no extra spaces or characters in the environment variable'
  ];

  const serviceUrls = {
    huggingface: 'https://huggingface.co/settings/tokens',
    base44: 'Contact your Base44 administrator for API key',
    brevo: 'https://app.brevo.com/settings/keys/api'
  };

  if (!validationResult.valid) {
    const troubleshooting = {
      error: validationResult.error,
      message: validationResult.message,
      steps: [...baseSteps]
    };

    // Add specific steps based on error type
    switch (validationResult.error) {
      case 'TOKEN_MISSING':
        troubleshooting.steps.unshift('Set the required environment variable with your API token');
        break;
      case 'TOKEN_EMPTY':
        troubleshooting.steps.unshift('Ensure the environment variable contains a valid token value');
        break;
      case 'TOKEN_INVALID_FORMAT':
        troubleshooting.steps.push(`Expected format: ${validationResult.expectedFormat}`);
        if (validationResult.example) {
          troubleshooting.steps.push(`Example format: ${validationResult.example}`);
        }
        break;
    }

    // Add service-specific URL
    if (serviceUrls[service]) {
      troubleshooting.steps.push(`Get a new token from: ${serviceUrls[service]}`);
    }

    // Add restart instruction
    troubleshooting.steps.push('Restart your application after updating the token');

    return troubleshooting;
  }

  // Handle security warnings for valid tokens
  if (validationResult.securityIssues && validationResult.securityIssues.length > 0) {
    return {
      warning: 'Token validation passed but security issues detected',
      issues: validationResult.securityIssues,
      steps: [
        'Review the security issues listed above',
        'Consider generating a new token if using placeholder values',
        'Ensure you are using a production-ready token'
      ]
    };
  }

  return {
    success: true,
    message: 'Token validation passed successfully',
    steps: [
      'Token format is valid',
      'No security issues detected',
      'Token is ready for use'
    ]
  };
}

/**
 * Pre-request token validation for API calls
 * @param {string} token - The token to validate
 * @param {string} service - The service type
 * @returns {Promise<Object>} Validation result with early error detection
 */
export async function preRequestTokenValidation(token, service) {
  // Basic format validation
  const formatValidation = validateTokenFormat(token, service);
  
  if (!formatValidation.valid) {
    return {
      valid: false,
      canProceed: false,
      error: formatValidation.error,
      message: formatValidation.message,
      troubleshooting: generateTokenTroubleshooting(formatValidation, service)
    };
  }

  // Check for security issues
  if (formatValidation.securityIssues && formatValidation.securityIssues.length > 0) {
    const hasPlaceholder = formatValidation.securityIssues.some(
      issue => issue.type === 'PLACEHOLDER_VALUE'
    );
    
    if (hasPlaceholder) {
      return {
        valid: false,
        canProceed: false,
        error: 'PLACEHOLDER_TOKEN',
        message: 'Token appears to be a placeholder value and cannot be used for API calls',
        troubleshooting: generateTokenTroubleshooting(formatValidation, service)
      };
    }
  }

  return {
    valid: true,
    canProceed: true,
    token: formatValidation.token,
    service: service,
    validatedAt: formatValidation.validatedAt
  };
}

export default {
  validateTokenFormat,
  validateMultipleTokens,
  sanitizeTokenForLogging,
  sanitizeErrorMessage,
  isTokenExpired,
  generateTokenTroubleshooting,
  preRequestTokenValidation,
  TOKEN_PATTERNS
};