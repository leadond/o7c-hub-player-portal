/**
 * Environment Configuration Utility
 * Centralizes environment variable management and validation
 */

/**
 * Environment variable configuration schema
 */
const ENV_CONFIG = {
  huggingFaceToken: {
    clientSide: 'VITE_HUGGINGFACE_API_TOKEN',
    serverSide: 'HUGGINGFACE_API_TOKEN',
    required: true,
    format: /^hf_[a-zA-Z0-9]{34}$/,
    description: 'HuggingFace API token for AI inference',
    setupUrl: 'https://huggingface.co/settings/tokens'
  },
  base44ApiKey: {
    clientSide: 'VITE_BASE44_API_KEY',
    serverSide: 'BASE44_API_KEY',
    required: true,
    description: 'Base44 API key for data operations'
  },
  brevoApiKey: {
    serverSide: 'BREVO_API_KEY',
    required: false,
    description: 'Brevo API key for email services'
  },
  o7cHubUrl: {
    clientSide: 'VITE_O7C_HUB_URL',
    serverSide: 'O7C_HUB_URL',
    required: false,
    description: 'O7C Hub application URL for switching between portals',
    fallback: 'http://localhost:3000'
  }
};

import { validateTokenFormat as validateToken } from './tokenValidation.js';

/**
 * Validates token format based on service type
 * @param {string} token - The token to validate
 * @param {string} service - The service type (e.g., 'huggingFaceToken')
 * @returns {boolean} - True if token format is valid
 */
export function validateTokenFormat(token, service) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Map service names to token validation service names
  const serviceMapping = {
    'huggingFaceToken': 'huggingface',
    'base44ApiKey': 'base44',
    'brevoApiKey': 'brevo'
  };
  
  const validationService = serviceMapping[service];
  if (validationService) {
    const result = validateToken(token, validationService);
    return result.valid;
  }
  
  // Fallback to legacy validation for unknown services
  const config = ENV_CONFIG[service];
  if (!config || !config.format) {
    // If no format specified, just check it's a non-empty string
    return token.trim().length > 0;
  }
  
  return config.format.test(token);
}

/**
 * Gets environment variable value with fallback support
 * @param {string} service - The service configuration key
 * @param {boolean} isServerSide - Whether running on server side
 * @returns {string|null} - The environment variable value or null
 */
export function getEnvVariable(service, isServerSide = false) {
  const config = ENV_CONFIG[service];
  if (!config) {
    throw new Error(`Unknown service configuration: ${service}`);
  }

  let value = null;

  if (isServerSide && config.serverSide) {
    // Server-side: try server variable first, then client as fallback
    value = process.env[config.serverSide] || process.env[config.clientSide];
  } else if (config.clientSide) {
    // Client-side: only use client variables
    value = import.meta.env[config.clientSide];
  }

  return value || null;
}

/**
 * Gets URL with environment-based configuration and fallback handling
 * @param {string} service - The service configuration key (must be a URL type)
 * @param {boolean} isServerSide - Whether running on server side
 * @returns {string} - The URL with fallback to localhost for development
 */
export function getUrl(service, isServerSide = false) {
  const config = ENV_CONFIG[service];
  if (!config) {
    throw new Error(`Unknown service configuration: ${service}`);
  }

  // Get the environment variable value
  let url = null;

  if (isServerSide && config.serverSide) {
    // Server-side: try server variable first, then client as fallback
    url = process.env[config.serverSide] || process.env[config.clientSide];
  } else if (config.clientSide) {
    // Client-side: only use client variables
    url = import.meta.env[config.clientSide];
  }

  // Return environment URL if available, otherwise use fallback
  return url || config.fallback || 'http://localhost:3000';
}

/**
 * Validates environment configuration for a specific service
 * @param {string} service - The service configuration key
 * @param {boolean} isServerSide - Whether running on server side
 * @returns {Object} - Validation result with success, value, and error details
 */
export function validateEnvConfig(service, isServerSide = false) {
  const config = ENV_CONFIG[service];
  if (!config) {
    return {
      success: false,
      error: `Unknown service configuration: ${service}`,
      errorCode: 'UNKNOWN_SERVICE'
    };
  }
  
  const value = getEnvVariable(service, isServerSide);
  
  // Check if required variable is missing
  if (config.required && !value) {
    const expectedVar = isServerSide ? 
      (config.serverSide || config.clientSide) : 
      config.clientSide;
      
    return {
      success: false,
      error: `Missing required environment variable: ${expectedVar}`,
      errorCode: 'MISSING_VARIABLE',
      troubleshooting: {
        steps: [
          `Set ${expectedVar} in your environment variables`,
          config.setupUrl ? `Get your token from: ${config.setupUrl}` : 'Obtain the required API key',
          'Restart your application after setting the variable'
        ],
        description: config.description,
        setupUrl: config.setupUrl
      }
    };
  }
  
  // Check token format if specified
  if (value && !validateTokenFormat(value, service)) {
    return {
      success: false,
      error: `Invalid format for ${service}`,
      errorCode: 'INVALID_FORMAT',
      troubleshooting: {
        steps: [
          'Verify the token format is correct',
          config.setupUrl ? `Generate a new token at: ${config.setupUrl}` : 'Check your API key format',
          'Ensure no extra spaces or characters in the environment variable'
        ],
        description: config.description,
        expectedFormat: config.format ? config.format.toString() : 'Valid API key format'
      }
    };
  }
  
  return {
    success: true,
    value: value
  };
}

/**
 * Validates all required environment variables
 * @param {boolean} isServerSide - Whether running on server side
 * @returns {Object} - Overall validation result
 */
export function validateAllEnvConfig(isServerSide = false) {
  const results = {};
  const errors = [];
  
  for (const [service, config] of Object.entries(ENV_CONFIG)) {
    if (config.required) {
      const result = validateEnvConfig(service, isServerSide);
      results[service] = result;
      
      if (!result.success) {
        errors.push({
          service,
          ...result
        });
      }
    }
  }
  
  return {
    success: errors.length === 0,
    results,
    errors,
    summary: {
      total: Object.keys(ENV_CONFIG).filter(key => ENV_CONFIG[key].required).length,
      valid: Object.keys(results).filter(key => results[key].success).length,
      invalid: errors.length
    }
  };
}

/**
 * Gets troubleshooting information for environment setup
 * @returns {Object} - Troubleshooting guide
 */
export function getEnvSetupGuide() {
  return {
    title: 'Environment Variable Setup Guide',
    description: 'Follow these steps to configure your environment variables correctly',
    steps: [
      {
        step: 1,
        title: 'Copy environment template',
        description: 'Copy .env.example to .env',
        command: 'cp .env.example .env'
      },
      {
        step: 2,
        title: 'Configure required variables',
        description: 'Replace placeholder values with actual API keys',
        variables: Object.entries(ENV_CONFIG)
          .filter(([, config]) => config.required)
          .map(([service, config]) => ({
            service,
            variable: config.serverSide || config.clientSide,
            description: config.description,
            setupUrl: config.setupUrl
          }))
      },
      {
        step: 3,
        title: 'Validate configuration',
        description: 'Test your configuration by running the application',
        note: 'Check browser console and server logs for validation errors'
      }
    ],
    production: {
      title: 'Production Deployment (Vercel)',
      steps: [
        'Go to your Vercel dashboard',
        'Select your project',
        'Navigate to Settings > Environment Variables',
        'Add each required environment variable',
        'Redeploy your application'
      ]
    }
  };
}

export default {
  validateTokenFormat,
  getEnvVariable,
  getUrl,
  validateEnvConfig,
  validateAllEnvConfig,
  getEnvSetupGuide,
  ENV_CONFIG
};