import { Player, School, Coach } from '../entities.js';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../../lib/firebase.js';
import {
  sanitizeErrorMessage,
  sanitizeTokenForLogging,
  isTokenExpired
} from '../../utils/tokenValidation.js';
import { createSecureLogger } from '../../utils/secureLogger.js';
import { documentationService } from './documentationService.js';

// Create secure logger for this component
const logger = createSecureLogger('AI Service');

/**
 * Custom error class for AI service errors with user-friendly messaging
 */
class AIServiceError extends Error {
  constructor(message, errorCode, userMessage, troubleshooting) {
    super(message);
    this.name = 'AIServiceError';
    this.errorCode = errorCode;
    this.userMessage = userMessage;
    this.troubleshooting = troubleshooting;
  }
}

/**
 * Handles AI service responses and provides user-friendly error information
 * @param {Object} response - Response from invokeLLM
 * @returns {Object} Processed response with user-friendly error handling
 */
export function handleAIResponse(response) {
  if (response.success) {
    return {
      success: true,
      content: response.response,
      model: response.model,
      tokens: response.tokens,
      generatedAt: response.generatedAt,
      fallback: response.fallback || false
    };
  }

  // Handle error responses with user-friendly messaging
  return {
    success: false,
    error: {
      code: response.errorCode || 'UNKNOWN_ERROR',
      message: response.userMessage || response.error || 'An unexpected error occurred',
      troubleshooting: response.troubleshooting || {
        steps: ['Try again later', 'Contact support if the issue persists']
      },
      technical: response.error // Keep technical details for debugging
    },
    fallback: response.fallback || false
  };
}

/**
 * Determines if an error should trigger a fallback response
 * @param {string} errorCode - The error code from the AI service
 * @returns {boolean} True if fallback should be used
 */
export function shouldUseFallback(errorCode) {
  const fallbackErrorCodes = [
    'UNAUTHORIZED',
    'MISSING_TOKEN',
    'INVALID_TOKEN_FORMAT',
    'NETWORK_ERROR',
    'SERVICE_UNAVAILABLE',
    'MODEL_LOADING',
    'RATE_LIMITED'
  ];

  return fallbackErrorCodes.includes(errorCode);
}

/**
 * Provides fallback response when AI service is unavailable
 * @param {string} query - The user query
 * @param {string} model - The model that was requested
 * @returns {Object} Fallback response object
 */
function getFallbackResponse(query, model) {
  // Provide a helpful message based on the type of query if possible
  let fallbackMessage = 'AI features are currently unavailable, but you can still use all other features of the application.';
  let fallbackSteps = [
    'Try again later when the AI service is restored',
    'Contact your administrator if this issue persists',
    'All other application features remain fully functional'
  ];

  // Customize message based on query content if available
  if (query && typeof query === 'string') {
    if (query.toLowerCase().includes('player') || query.toLowerCase().includes('recruit')) {
      fallbackMessage = 'AI-powered player analysis is temporarily unavailable. You can still view player profiles, stats, and manage recruiting manually.';
      fallbackSteps = [
        'Use the player search and filtering features',
        'View player profiles and statistics manually',
        'Try the AI features again later',
        'Contact support if AI features remain unavailable'
      ];
    } else if (query.toLowerCase().includes('team') || query.toLowerCase().includes('roster')) {
      fallbackMessage = 'AI-powered team analysis is temporarily unavailable. You can still manage teams and rosters using the standard interface.';
      fallbackSteps = [
        'Use the team management interface',
        'Access roster information directly',
        'Try the AI features again later',
        'Contact support if AI features remain unavailable'
      ];
    }
  }

  return {
    success: false,
    error: 'AI service unavailable',
    errorCode: 'SERVICE_UNAVAILABLE',
    userMessage: fallbackMessage,
    troubleshooting: {
      steps: fallbackSteps,
      note: 'This is a graceful fallback - the application continues to work normally without AI features.'
    },
    response: null,
    model: model,
    tokens: { prompt: 0, completion: 0, total: 0 },
    generatedAt: new Date().toISOString(),
    fallback: true
  };
}

/**
 * Checks if AI service is available by testing configuration and connectivity
 * @returns {Promise<{available: boolean, status: string, errorCode?: string, message?: string}>} Service availability status
 */
export async function isAIServiceAvailable() {
  try {
    const response = await fetch('/api/huggingface', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/flan-t5-large',
        inputs: 'test',
        options: { max_length: 10 }
      }),
    });

    // Parse response to get detailed status information
    const responseData = await response.json().catch(() => ({}));

    if (response.ok) {
      return {
        available: true,
        status: 'operational',
        message: 'AI service is fully operational'
      };
    }

    // Handle specific error cases
    if (response.status === 401) {
      return {
        available: false,
        status: 'authentication_error',
        errorCode: responseData.errorCode || 'UNAUTHORIZED',
        message: responseData.message || 'AI service authentication failed - token may be invalid or expired'
      };
    }

    if (response.status === 500 && responseData.errorCode === 'MISSING_TOKEN') {
      return {
        available: false,
        status: 'not_configured',
        errorCode: 'MISSING_TOKEN',
        message: 'AI service is not configured - missing API token'
      };
    }

    if (response.status === 500 && responseData.errorCode === 'INVALID_TOKEN_FORMAT') {
      return {
        available: false,
        status: 'configuration_error',
        errorCode: 'INVALID_TOKEN_FORMAT',
        message: 'AI service configuration error - invalid token format'
      };
    }

    if (response.status === 429) {
      return {
        available: false,
        status: 'rate_limited',
        errorCode: 'RATE_LIMITED',
        message: 'AI service is rate limited - temporarily unavailable'
      };
    }

    if (response.status === 503) {
      return {
        available: false,
        status: 'loading',
        errorCode: 'MODEL_LOADING',
        message: 'AI service is loading - should be available shortly'
      };
    }

    // Other error status codes
    return {
      available: false,
      status: 'error',
      errorCode: responseData.errorCode || 'API_ERROR',
      message: responseData.message || `AI service error: ${response.status}`
    };

  } catch (error) {
    // Network or other connectivity errors
    return {
      available: false,
      status: 'unreachable',
      errorCode: 'NETWORK_ERROR',
      message: 'Unable to reach AI service - check network connectivity'
    };
  }
}

/**
 * Extracts the user query from the params
 * @param {Object} params - LLM invocation parameters
 * @returns {string} The user query
 */
function getUserQuery(params) {
  if (params.messages && params.messages.length > 0) {
    const lastMessage = params.messages[params.messages.length - 1];
    if (lastMessage.role === 'user') {
      return lastMessage.content;
    }
  }
  return params.prompt || '';
}

/**
 * Builds a comprehensive system prompt with O7C Hub expertise
 * @returns {string} Enhanced system prompt
 */
function buildO7CHubSystemPrompt() {
  return `You are an expert AI assistant for the O7C Hub application, a comprehensive recruiting and athlete management platform for Ohio baseball.

## Your Expertise Areas:

### 1. PLAYER MANAGEMENT
- Player profiles, statistics, and performance tracking
- Academic information and GPA monitoring
- Contact details and communication preferences
- Medical history and injury tracking
- Equipment and uniform assignments

### 2. RECRUITING SYSTEM
- College recruiting process and timelines
- NCAA compliance and eligibility rules
- Scholarship offers and commitment tracking
- Coach communications and evaluations
- Recruiting calendars and deadlines

### 3. TEAM MANAGEMENT
- Roster management and player assignments
- Team scheduling and practice planning
- Tournament registrations and travel coordination
- Fee collection and financial tracking
- Parent communications and updates

### 4. ANALYTICS & INSIGHTS
- Performance analytics and trend analysis
- Statistical comparisons and benchmarks
- Recruiting success metrics
- Team performance indicators
- Predictive modeling for player development

### 5. USER ROLES & PERMISSIONS
- Admin: Full system access and configuration
- Coach: Team management and player oversight
- Parent: Child's information and communications
- Player: Personal profile and recruiting status

## Your Capabilities:
- Access real-time player, team, and recruiting data
- Provide data-driven insights and recommendations
- Answer questions about platform features and functionality
- Assist with recruiting strategy and player development
- Help troubleshoot platform issues and guide users
- Generate reports and analytics summaries

## Communication Guidelines:
- Be professional, helpful, and encouraging
- Use clear, concise language appropriate for baseball recruiting
- Provide specific, actionable advice when possible
- Reference actual data points and statistics when available
- Acknowledge limitations when data isn't available
- Focus on baseball recruiting excellence and athlete development

## Data Access:
You have access to comprehensive player databases, recruiting histories, team information, and platform documentation. Use this context to provide informed, accurate responses about the O7C Hub ecosystem.`;
}

/**
 * Builds conversation context from message history
 * @param {Array} messages - Chat message history
 * @returns {string} Formatted conversation context
 */
function buildConversationContext(messages) {
  if (!messages || messages.length <= 1) return '';

  const recentMessages = messages.slice(-6); // Last 6 messages for context
  const contextParts = [];

  for (const message of recentMessages) {
    if (message.role === 'user') {
      contextParts.push(`User: ${message.content}`);
    } else if (message.role === 'assistant') {
      contextParts.push(`Assistant: ${message.content}`);
    }
  }

  return `Recent Conversation:\n${contextParts.join('\n')}\n`;
}

/**
 * Enhanced data fetching with intelligent query analysis and broader data access
 * @param {string} query - The user query
 * @param {Object} [userContext] - User context for role-based data access
 * @returns {Promise<string>} Formatted data context
 */
async function fetchRelevantData(query, userContext = {}) {
  const data = [];
  const seenIds = new Set();

  try {
    // Analyze query for different types of requests
    const queryLower = query.toLowerCase();
    const isPlayerQuery = /\b(player|players|athlete|student)\b/i.test(queryLower);
    const isTeamQuery = /\b(team|roster|squad)\b/i.test(queryLower);
    const isRecruitingQuery = /\b(recruit|recruiting|college|scholarship|commit)\b/i.test(queryLower);
    const isAnalyticsQuery = /\b(stat|performance|analytics|trend|average|gpa)\b/i.test(queryLower);

    // Extract potential names and identifiers
    const words = query.split(/\s+/).filter(word =>
      word.length > 1 &&
      /[A-Z]/.test(word) &&
      !['The', 'And', 'Or', 'But', 'In', 'On', 'At', 'To', 'For', 'Of', 'With', 'By'].includes(word)
    );

    // Enhanced search patterns
    const searchPatterns = [
      // Direct name searches
      ...words.slice(0, 3),
      // Extract potential school names (words with multiple capitals)
      ...query.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [],
      // Extract years/class references
      ...query.match(/\b(20\d{2}|class\s+of\s+\d{4})\b/gi) || []
    ];

    for (const pattern of searchPatterns.slice(0, 5)) {
      try {
        // Enhanced player search with multiple fields
        if (isPlayerQuery || words.length > 0) {
          const playerSearches = [
            { fullname: pattern },
            { firstName: pattern },
            { lastName: pattern },
            { emailAddress: pattern },
            { commitment: pattern }
          ];

          for (const search of playerSearches) {
            const players = await Player.filter(search, 2);
            if (players && players.length > 0) {
              for (const player of players) {
                if (!seenIds.has(`player-${player.id}`)) {
                  data.push({
                    type: 'player',
                    data: {
                      id: player.id,
                      name: `${player.firstName} ${player.lastName}`,
                      position: player.position,
                      grade: player.grade,
                      commitment: player.commitment,
                      gpa: player.gpa,
                      contact: player.emailAddress,
                      phone: player.phoneNumber,
                      stats: player.stats || {}
                    }
                  });
                  seenIds.add(`player-${player.id}`);
                }
              }
            }
          }
        }

        // Enhanced school search
        const schoolSearches = [
          { name: pattern },
          { city: pattern },
          { state: pattern }
        ];

        for (const search of schoolSearches) {
          const schools = await School.filter(search, 2);
          if (schools && schools.length > 0) {
            for (const school of schools) {
              if (!seenIds.has(`school-${school.id}`)) {
                data.push({
                  type: 'school',
                  data: {
                    id: school.id,
                    name: school.name,
                    city: school.city,
                    state: school.state,
                    type: school.type
                  }
                });
                seenIds.add(`school-${school.id}`);
              }
            }
          }
        }

        // Enhanced coach search
        if (isTeamQuery || isRecruitingQuery) {
          const coachSearches = [
            { firstName: pattern },
            { lastName: pattern },
            { email: pattern }
          ];

          for (const search of coachSearches) {
            const coaches = await Coach.filter(search, 2);
            if (coaches && coaches.length > 0) {
              for (const coach of coaches) {
                if (!seenIds.has(`coach-${coach.id}`)) {
                  data.push({
                    type: 'coach',
                    data: {
                      id: coach.id,
                      name: `${coach.firstName} ${coach.lastName}`,
                      email: coach.email,
                      phone: coach.phoneNumber,
                      team: coach.teamName
                    }
                  });
                  seenIds.add(`coach-${coach.id}`);
                }
              }
            }
          }
        }
      } catch (e) {
        logger.debug('Error fetching data for pattern', {
          pattern: pattern,
          error: sanitizeErrorMessage(e.message || 'Unknown error'),
          errorName: e.name
        });
      }
    }

    // Add contextual data based on query type
    if (isAnalyticsQuery) {
      try {
        // Add general analytics context
        const totalPlayers = await Player.list(undefined, 1); // Just get count
        data.push({
          type: 'analytics_context',
          data: {
            totalPlayers: totalPlayers?.length || 0,
            queryType: 'analytics'
          }
        });
      } catch (e) {
        logger.debug('Error fetching analytics context', {
          error: sanitizeErrorMessage(e.message || 'Unknown error')
        });
      }
    }

    if (isRecruitingQuery) {
      try {
        // Add recruiting context
        data.push({
          type: 'recruiting_context',
          data: {
            currentSeason: new Date().getFullYear(),
            recruitingPeriods: ['Fall', 'Winter', 'Spring', 'Summer'],
            queryType: 'recruiting'
          }
        });
      } catch (e) {
        logger.debug('Error fetching recruiting context', {
          error: sanitizeErrorMessage(e.message || 'Unknown error')
        });
      }
    }

  } catch (e) {
    logger.debug('Error in enhanced data fetching', {
      error: sanitizeErrorMessage(e.message || 'Unknown error'),
      errorName: e.name
    });
  }

  if (data.length === 0) return '';

  // Limit total data to 12 items and format nicely
  const limitedData = data.slice(0, 12);

  return '\nRelevant Application Data:\n' + limitedData.map(item => {
    const { type, data: itemData } = item;
    return `[${type.toUpperCase()}]\n${JSON.stringify(itemData, null, 2)}`;
  }).join('\n\n');
}

/**
 * AI service integration with Hugging Face free inference API
 * Replaces base44.integrations.Core.InvokeLLM
 * @param {Object} params - LLM invocation parameters
 * @param {string} params.prompt - The prompt to send to the LLM (legacy)
 * @param {Array} [params.messages] - Chat messages array
 * @param {string} [params.systemPrompt] - System prompt for the conversation
 * @param {string} [params.dataContext] - Data context to enable data-only responses
 * @param {string} [params.model] - Model to use
 * @param {number} [params.temperature] - Temperature setting (not supported by HF free API)
 * @param {boolean} [params.gracefulFallback] - Whether to return fallback response on critical errors
 * @returns {Promise<Object>} LLM response
 */
export async function invokeLLM(params) {
  const model = params.model || 'google/flan-t5-large';
  const endpoint = '/api/huggingface';
  const gracefulFallback = params.gracefulFallback !== false; // Default to true

  // Prepare messages
  let messages;
  if (params.messages && Array.isArray(params.messages)) {
    messages = params.messages;
  } else if (params.prompt) {
    messages = [{ role: 'user', content: params.prompt }];
  } else {
    throw new Error('Either prompt or messages must be provided');
  }

  // Fetch relevant data context
  let dataContext = params.dataContext || '';
  const userQuery = getUserQuery(params);
  if (userQuery) {
    try {
      const fetchedData = await fetchRelevantData(userQuery);
      if (fetchedData) {
        dataContext += fetchedData;
      }

      // Check if this is a documentation-related query and add documentation context
      const docKeywords = ['how', 'what', 'guide', 'help', 'documentation', 'manual', 'tutorial', 'feature', 'function', 'api', 'endpoint', 'error', 'troubleshoot', 'problem', 'issue'];
      const isDocumentationQuery = docKeywords.some(keyword =>
        userQuery.toLowerCase().includes(keyword)
      );

      if (isDocumentationQuery) {
        try {
          logger.debug('Detected documentation query, fetching relevant documentation context', {
            query: userQuery.substring(0, 100)
          });

          const docResponse = await documentationService.askQuestion(userQuery);
          if (docResponse.success && docResponse.answer) {
            dataContext += `\n\nDocumentation Context:\n${docResponse.answer}`;
            if (docResponse.metadata?.relevantSections?.length > 0) {
              dataContext += `\n\nRelevant Documentation Sections:\n${docResponse.metadata.relevantSections.map(s => `- ${s.title} (${s.path})`).join('\n')}`;
            }
          }
        } catch (docError) {
          logger.debug('Error fetching documentation context', {
            error: sanitizeErrorMessage(docError.message || 'Unknown error')
          });
          // Don't fail the main AI request if documentation context fails
        }
      }
    } catch (e) {
      logger.debug('Error fetching relevant data for query', {
        queryLength: userQuery?.length || 0,
        error: sanitizeErrorMessage(e.message || 'Unknown error'),
        errorName: e.name
      });
    }
  }

  // Build comprehensive system prompt with O7C Hub expertise
  const systemPrompt = params.systemPrompt || buildO7CHubSystemPrompt();

  // Build conversation context from message history
  const conversationContext = buildConversationContext(messages);

  // Build the prompt for Flan-T5 with enhanced context
  let prompt = `${systemPrompt}\n\n${conversationContext}`;

  // Add data context if provided
  if (dataContext) {
    prompt += `\n\nRelevant Application Data:\n${dataContext}`;
  }

  // For Flan-T5, use only the last user message
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (lastUserMessage) {
    prompt += `\n\nUser Question: ${lastUserMessage.content}`;
  } else {
    prompt += `\n\nUser Question: ${params.prompt || ''}`;
  }

  // Prepare request body with enhanced parameters for better responses
  const requestBody = {
    model: 'google/flan-t5-large', // Upgrade to larger model for better understanding
    inputs: prompt,
    options: {
      wait_for_model: true,
      use_cache: false,
      max_new_tokens: 512,
      temperature: 0.3,
      do_sample: true,
      repetition_penalty: 1.1,
      length_penalty: 1.0,
    },
  };

  try {
    logger.debug('Making LLM request', {
      model: model,
      endpoint: endpoint,
      promptLength: prompt.length,
      hasDataContext: !!dataContext,
      gracefulFallback: gracefulFallback
    });

    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    const duration = Date.now() - startTime;

    logger.performance('LLM API call', duration, {
      model: model,
      status: response.status,
      promptLength: prompt.length
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Unknown error',
        errorCode: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred'
      }));

      // Use server-provided error information when available
      const errorCode = errorData.errorCode || 'UNKNOWN_ERROR';
      const userMessage = errorData.message || 'An unexpected error occurred';
      const troubleshooting = errorData.troubleshooting || { steps: [] };

      // Handle specific authentication errors with enhanced messaging
      if (response.status === 401) {
        const authErrorMessage = errorData.message || 'The AI service authentication has failed. This usually means the API token is invalid, expired, or missing.';
        const authTroubleshooting = errorData.troubleshooting || {
          steps: [
            'Contact your system administrator to verify the API token configuration',
            'The HuggingFace API token may need to be renewed',
            'Check that the token has proper permissions for the inference API'
          ],
          documentation: 'https://huggingface.co/docs/api-inference/quicktour'
        };

        throw new AIServiceError(
          'Authentication failed with AI service',
          errorCode,
          authErrorMessage,
          authTroubleshooting
        );
      }

      // Handle rate limiting with server-provided details
      if (response.status === 429) {
        const rateLimitMessage = errorData.message || 'The AI service is currently experiencing high demand. Please wait before trying again.';
        const rateLimitTroubleshooting = errorData.troubleshooting || {
          steps: [
            'Wait a few minutes before making another request',
            'Try with shorter input text to reduce processing time',
            'The service may be experiencing high demand'
          ]
        };

        throw new AIServiceError(
          'Rate limit exceeded',
          errorCode,
          rateLimitMessage,
          rateLimitTroubleshooting
        );
      }

      // Handle model loading with server-provided details
      if (response.status === 503) {
        const loadingMessage = errorData.message || 'The AI model is currently loading. This is normal for the first request and should resolve shortly.';
        const loadingTroubleshooting = errorData.troubleshooting || {
          steps: [
            'Wait 10-30 seconds and try again',
            'The model needs time to initialize on first use',
            'Subsequent requests should be faster'
          ]
        };

        throw new AIServiceError(
          'AI model is loading',
          errorCode,
          loadingMessage,
          loadingTroubleshooting
        );
      }

      // Handle bad requests with server-provided details
      if (response.status === 400) {
        const badRequestMessage = errorData.message || 'Your input could not be processed by the AI service. Please check your input and try again.';
        const badRequestTroubleshooting = errorData.troubleshooting || {
          steps: [
            'Try with shorter or simpler text',
            'Remove any special characters that might cause issues',
            'Ensure your input is in a supported format'
          ]
        };

        throw new AIServiceError(
          'Invalid request to AI service',
          errorCode,
          badRequestMessage,
          badRequestTroubleshooting
        );
      }

      // Handle server configuration errors (500 status)
      if (response.status === 500) {
        const serverErrorMessage = errorData.message || 'The AI service is experiencing a configuration issue. Please contact your administrator.';
        const serverTroubleshooting = errorData.troubleshooting || {
          steps: [
            'Contact your system administrator',
            'The AI service may need to be reconfigured',
            'Try again later as this may be a temporary issue'
          ]
        };

        throw new AIServiceError(
          'AI service configuration error',
          errorCode,
          serverErrorMessage,
          serverTroubleshooting
        );
      }

      // Generic error for other status codes using server-provided information
      throw new AIServiceError(
        `AI service error: ${response.status}`,
        errorCode,
        userMessage,
        troubleshooting.steps.length > 0 ? troubleshooting : {
          steps: [
            'Try again in a few moments',
            'Check your internet connection',
            'Contact support if the issue persists'
          ]
        }
      );
    }

    const data = await response.json();

    // Extract response content
    let responseContent = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      responseContent = data[0].generated_text.trim();
    } else if (data.generated_text) {
      responseContent = data.generated_text.trim();
    } else {
      throw new Error('Invalid response from Hugging Face API: no generated_text in response');
    }

    // Increment AI usage counter
    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'counters', 'aiUsage');
        const counterDoc = await transaction.get(counterRef);
        const newCount = (counterDoc.exists() ? counterDoc.data().count || 0 : 0) + 1;
        transaction.set(counterRef, { count: newCount }, { merge: true });
      });
    } catch (counterError) {
      logger.warn('Error updating AI usage counter', {
        error: sanitizeErrorMessage(counterError.message || 'Unknown error'),
        errorName: counterError.name
      });
      // Don't fail the AI call if counter update fails
    }

    logger.info('LLM request completed successfully', {
      model: model,
      responseLength: responseContent.length,
      duration: duration
    });

    // Return in expected format
    return {
      success: true,
      response: responseContent,
      model: model,
      tokens: {
        prompt: 0, // HF free API doesn't provide token counts
        completion: 0,
        total: 0,
      },
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    // Enhanced error logging with sanitization
    logger.error('Error invoking LLM', {
      error: sanitizeErrorMessage(error.message || 'Unknown error'),
      errorName: error.name,
      errorCode: error.errorCode || 'UNKNOWN_ERROR',
      model: model,
      queryLength: getUserQuery(params)?.length || 0,
      gracefulFallback: gracefulFallback
    });

    // Handle AIServiceError with enhanced user messaging and fallback behavior
    if (error instanceof AIServiceError) {
      // Log detailed error information for debugging while showing user-friendly messages
      logger.error(`AI Service Error [${error.errorCode}]`, {
        message: sanitizeErrorMessage(error.message),
        userMessage: error.userMessage,
        troubleshooting: error.troubleshooting,
        isTokenExpired: isTokenExpired(error.message),
        model: model
      });

      // Provide fallback response for authentication and configuration errors when graceful fallback is enabled
      if (gracefulFallback && (
        error.errorCode === 'UNAUTHORIZED' ||
        error.errorCode === 'MISSING_TOKEN' ||
        error.errorCode === 'INVALID_TOKEN_FORMAT' ||
        error.errorCode === 'MODEL_LOADING' ||
        error.errorCode === 'RATE_LIMITED'
      )) {
        logger.info('Providing fallback response due to AI service unavailability', {
          errorCode: error.errorCode,
          model: model,
          queryLength: getUserQuery(params)?.length || 0
        });
        return getFallbackResponse(getUserQuery(params), model);
      }

      return {
        success: false,
        error: error.message,
        errorCode: error.errorCode,
        userMessage: error.userMessage,
        troubleshooting: error.troubleshooting,
        response: null,
        model: model,
        tokens: { prompt: 0, completion: 0, total: 0 },
        generatedAt: new Date().toISOString(),
      };
    }

    // Handle network and other unexpected errors with enhanced categorization
    let errorCode = 'UNKNOWN_ERROR';
    let userMessage = 'An unexpected error occurred while processing your request.';
    let troubleshooting = {
      steps: [
        'Try again in a few moments',
        'Check your internet connection',
        'Contact support if the issue persists'
      ]
    };

    // Network connectivity errors
    if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      errorCode = 'NETWORK_ERROR';
      userMessage = 'Unable to connect to the AI service. This could be due to network connectivity issues or the service being temporarily unavailable.';
      troubleshooting = {
        steps: [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a few minutes and try again',
          'The AI service may be temporarily unavailable'
        ]
      };

      // Provide fallback for network errors when graceful fallback is enabled
      if (gracefulFallback) {
        logger.info('Providing fallback response due to network error', {
          errorCode: errorCode,
          model: model,
          queryLength: getUserQuery(params)?.length || 0
        });
        return getFallbackResponse(getUserQuery(params), model);
      }
    }
    // Request timeout errors
    else if (error.name === 'AbortError') {
      errorCode = 'REQUEST_TIMEOUT';
      userMessage = 'The AI service request took too long to complete. This may be due to high demand or network issues.';
      troubleshooting = {
        steps: [
          'Try again with shorter input text',
          'Check your internet connection speed',
          'Wait a few minutes as the service may be experiencing high load',
          'Break longer requests into smaller parts'
        ]
      };

      // Provide fallback for timeout errors when graceful fallback is enabled
      if (gracefulFallback) {
        logger.info('Providing fallback response due to request timeout', {
          errorCode: errorCode,
          model: model,
          queryLength: getUserQuery(params)?.length || 0
        });
        return getFallbackResponse(getUserQuery(params), model);
      }
    }
    // JSON parsing errors (malformed response)
    else if (error instanceof SyntaxError && error.message.includes('JSON')) {
      errorCode = 'INVALID_RESPONSE';
      userMessage = 'The AI service returned an invalid response. This is usually a temporary issue.';
      troubleshooting = {
        steps: [
          'Try again in a few moments',
          'The AI service may be experiencing temporary issues',
          'Contact support if this error persists'
        ]
      };
    }
    // Generic errors with enhanced messaging
    else {
      logger.error('Unexpected error type', {
        name: error.name,
        error: sanitizeErrorMessage(error.message || 'Unknown error'),
        errorCode: errorCode,
        model: model
      });
      userMessage = 'An unexpected error occurred while communicating with the AI service.';
      troubleshooting = {
        steps: [
          'Try again in a few moments',
          'Refresh the page and try again',
          'Check your internet connection',
          'Contact support if the issue persists'
        ]
      };
    }

    // Enhanced error logging for debugging with sanitization
    logger.error(`Unhandled error [${errorCode}]`, {
      name: error.name,
      error: sanitizeErrorMessage(error.message || 'Unknown error'),
      stack: error.stack ? sanitizeErrorMessage(error.stack) : 'No stack trace',
      model: model,
      gracefulFallback: gracefulFallback
    });

    return {
      success: false,
      error: error.message,
      errorCode,
      userMessage,
      troubleshooting,
      response: null,
      model: model,
      tokens: { prompt: 0, completion: 0, total: 0 },
      generatedAt: new Date().toISOString(),
    };
  }
}