// Vercel serverless function to proxy requests to Base44 API
// This endpoint handles all Base44 API requests from the frontend
// Enhanced with comprehensive monitoring, logging, and error tracking

const BASE44_API_URL = 'https://app.base44.com/api';

// Monitoring and logging utilities
const REQUEST_ID_HEADER = 'x-request-id';
const SESSION_ID_HEADER = 'x-session-id';
const USER_ID_HEADER = 'x-user-id';

// Generate unique request ID for tracking
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced logging with structured data
function logRequest(requestId, level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    requestId,
    message,
    service: 'base44-proxy',
    ...data
  };

  // In production, you might want to send this to a logging service
  // For now, we'll use console logging with structured data
  if (level === 'error') {
    console.error(`[${timestamp}] ${level.toUpperCase()}:`, logEntry);
  } else {
    console.log(`[${timestamp}] ${level.toUpperCase()}:`, logEntry);
  }

  return logEntry;
}

// Performance monitoring
function startPerformanceTimer(requestId) {
  const startTime = process.hrtime.bigint();
  return {
    requestId,
    startTime,
    end: () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      return duration;
    }
  };
}

// Error tracking and categorization
function trackApiError(requestId, error, context = {}) {
  const errorInfo = {
    requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      status: error.status,
      code: error.code
    },
    context,
    timestamp: new Date().toISOString(),
    userAgent: context.userAgent,
    ip: context.ip,
    method: context.method,
    path: context.path,
    severity: error.status >= 500 ? 'high' : error.status >= 400 ? 'medium' : 'low'
  };

  // Log the error
  logRequest(requestId, 'error', 'API request failed', errorInfo);

  // In production, send to error tracking service
  // Example: Sentry.captureException(error, { extra: errorInfo });

  return errorInfo;
}

// Request metrics collection
function collectRequestMetrics(requestId, timer, response) {
  const duration = timer.end();
  const metrics = {
    requestId,
    duration,
    statusCode: response.status,
    contentType: response.headers.get('content-type'),
    contentLength: response.headers.get('content-length'),
    timestamp: new Date().toISOString(),
    performance: {
      duration,
      memoryUsage: process.memoryUsage ? {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) // MB
      } : null
    }
  };

  logRequest(requestId, 'info', 'Request completed', metrics);

  return metrics;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Request validation function
function validateRequest(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required and must be an object' };
  }

  const { method, path } = body;

  if (!method || typeof method !== 'string') {
    return { valid: false, error: 'Method is required and must be a string' };
  }

  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
    return { valid: false, error: 'Method must be one of: GET, POST, PUT, DELETE' };
  }

  if (!path || typeof path !== 'string') {
    return { valid: false, error: 'Path is required and must be a string' };
  }

  if (!path.startsWith('/')) {
    return { valid: false, error: 'Path must start with /' };
  }

  return { valid: true };
}

// Sanitize and build the target URL
function buildTargetUrl(path, query) {
  // Remove any potential malicious characters from path
  const sanitizedPath = path.replace(/[^a-zA-Z0-9\-_\/]/g, '');
  
  let targetUrl = `${BASE44_API_URL}${sanitizedPath}`;
  
  if (query && typeof query === 'object') {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        // Sanitize query parameters
        const sanitizedKey = String(key).replace(/[^a-zA-Z0-9\-_]/g, '');
        const sanitizedValue = String(value).slice(0, 1000); // Limit value length
        params.append(sanitizedKey, sanitizedValue);
      }
    });
    
    if (params.toString()) {
      targetUrl += `?${params.toString()}`;
    }
  }
  
  return targetUrl;
}

// Main handler function
export default async function handler(req, res) {
  const requestId = generateRequestId();
  const timer = startPerformanceTimer(requestId);

  // Extract request context for logging
  const requestContext = {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    sessionId: req.headers[SESSION_ID_HEADER],
    userId: req.headers[USER_ID_HEADER],
    bodySize: JSON.stringify(req.body || {}).length
  };

  // Set CORS and security headers
  Object.entries({ ...corsHeaders, ...securityHeaders }).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Add request ID to response headers for tracking
  res.setHeader(REQUEST_ID_HEADER, requestId);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    logRequest(requestId, 'info', 'OPTIONS preflight request handled', requestContext);
    return res.status(200).end();
  }

  // Only allow POST requests for the proxy
  if (req.method !== 'POST') {
    logRequest(requestId, 'warn', 'Method not allowed', {
      ...requestContext,
      attemptedMethod: req.method
    });
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are allowed for the Base44 proxy',
      requestId
    });
  }

  try {
    // Log incoming request
    logRequest(requestId, 'info', 'Incoming Base44 proxy request', requestContext);
    // Validate request body
    const validation = validateRequest(req.body);
    if (!validation.valid) {
      logRequest(requestId, 'warn', 'Request validation failed', {
        ...requestContext,
        validationError: validation.error
      });
      return res.status(400).json({
        error: 'Invalid request',
        message: validation.error,
        requestId
      });
    }

    const { method, path, query, body: requestBody } = req.body;

    // Build target URL
    const targetUrl = buildTargetUrl(path, query);

    // Prepare fetch options
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Proxy/1.0',
      },
    };

    // Add body for POST/PUT requests
    if (['POST', 'PUT'].includes(method.toUpperCase()) && requestBody) {
      fetchOptions.body = JSON.stringify(requestBody);
    }

    // Log outgoing request
    logRequest(requestId, 'info', 'Making request to Base44 API', {
      ...requestContext,
      targetMethod: method.toUpperCase(),
      targetUrl,
      hasBody: !!requestBody
    });

    // Make request to Base44 API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    try {
      response = await fetch(targetUrl, {
        ...fetchOptions,
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        logRequest(requestId, 'error', 'Request timeout', {
          ...requestContext,
          error: 'Request timeout after 30 seconds'
        });
        return res.status(504).json({
          error: 'Gateway timeout',
          message: 'Request to Base44 API timed out',
          requestId
        });
      }

      throw fetchError;
    }

    clearTimeout(timeoutId);

    // Collect response metrics
    const metrics = collectRequestMetrics(requestId, timer, response);

    logRequest(requestId, 'info', 'Received response from Base44 API', {
      ...requestContext,
      responseStatus: response.status,
      responseTime: metrics.duration
    });

    // Handle different response types
    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Return response with appropriate status
    if (!response.ok) {
      // Track API errors
      trackApiError(requestId, {
        name: 'Base44APIError',
        message: responseData?.message || 'Base44 API returned error',
        status: response.status
      }, {
        ...requestContext,
        base44Status: response.status,
        base44Response: responseData
      });

      return res.status(response.status).json({
        error: 'Base44 API Error',
        message: responseData?.message || responseData || 'Unknown error occurred',
        status: response.status,
        requestId
      });
    }

    // For DELETE requests, return success indicator
    if (method.toUpperCase() === 'DELETE') {
      logRequest(requestId, 'info', 'DELETE request completed successfully', requestContext);
      return res.status(200).json({ success: true, requestId });
    }

    // Return successful response
    logRequest(requestId, 'info', 'Request completed successfully', {
      ...requestContext,
      responseSize: JSON.stringify(responseData).length
    });

    return res.status(200).json(responseData);

  } catch (error) {
    // Enhanced error tracking and logging
    const errorInfo = trackApiError(requestId, error, requestContext);

    // Handle different types of errors with enhanced responses
    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: 'Gateway timeout',
        message: 'Request to Base44 API timed out',
        requestId
      });
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Unable to connect to Base44 API',
        requestId
      });
    }

    if (error.name === 'SyntaxError') {
      return res.status(502).json({
        error: 'Invalid response',
        message: 'Base44 API returned invalid JSON',
        requestId
      });
    }

    // Generic error response with request tracking
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request',
      requestId,
      errorId: errorInfo.errorId
    });
  }
}