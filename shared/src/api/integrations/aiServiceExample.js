/**
 * Example of how to use the enhanced AI service with proper error handling
 * This demonstrates best practices for handling AI service responses in components
 */

import { invokeLLM, isAIServiceAvailable, handleAIResponse } from './aiService.js';

/**
 * Example function showing how to use AI service with graceful error handling
 * @param {string} userInput - The user's input/query
 * @returns {Promise<Object>} Processed AI response with user-friendly error handling
 */
export async function processUserQuery(userInput) {
  try {
    // Check if AI service is available first (optional)
    const serviceStatus = await isAIServiceAvailable();
    if (!serviceStatus.available) {
      console.log('AI service not available:', serviceStatus.message);
      // You can still proceed - invokeLLM will handle this gracefully
    }

    // Make the AI request with graceful fallback enabled
    const response = await invokeLLM({
      prompt: userInput,
      gracefulFallback: true, // Enable fallback for better UX
      model: 'gpt2'
    });

    // Use the helper function to process the response
    return handleAIResponse(response);

  } catch (error) {
    // This should rarely happen due to graceful error handling in invokeLLM
    console.error('Unexpected error in AI service:', error);
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: 'An unexpected error occurred. Please try again.',
        troubleshooting: {
          steps: [
            'Refresh the page and try again',
            'Contact support if the issue persists'
          ]
        }
      },
      fallback: false
    };
  }
}

/**
 * Example React component usage pattern
 */
export const AIComponentExample = {
  // Example of how to handle AI responses in a React component
  handleAIQuery: async function(query, setLoading, setResult, setError) {
    setLoading(true);
    setError(null);

    try {
      const result = await processUserQuery(query);
      
      if (result.success) {
        // Handle successful response
        setResult({
          content: result.content,
          model: result.model,
          fallback: result.fallback
        });
        
        // Show user if this was a fallback response
        if (result.fallback) {
          console.log('AI service unavailable - showing fallback response');
        }
      } else {
        // Handle error with user-friendly messaging
        setError({
          message: result.error.message,
          troubleshooting: result.error.troubleshooting,
          canRetry: !result.error.code.includes('UNAUTHORIZED')
        });
      }
    } catch (error) {
      // Fallback error handling
      setError({
        message: 'Unable to process your request. Please try again.',
        troubleshooting: {
          steps: ['Check your internet connection', 'Try again in a few moments']
        },
        canRetry: true
      });
    } finally {
      setLoading(false);
    }
  }
};

/**
 * Example of checking service availability before showing AI features
 */
export async function shouldShowAIFeatures() {
  const status = await isAIServiceAvailable();
  
  // Show AI features even if there are temporary issues (graceful fallback will handle it)
  // Only hide if there are permanent configuration issues
  const permanentIssues = ['not_configured', 'configuration_error'];
  
  return !permanentIssues.includes(status.status);
}

/**
 * Example error message component data
 */
export function getErrorDisplayInfo(errorResponse) {
  if (!errorResponse.error) return null;

  const { code, message, troubleshooting } = errorResponse.error;
  
  // Customize display based on error type
  const displayConfig = {
    title: 'AI Service Error',
    message: message,
    steps: troubleshooting.steps || [],
    severity: 'warning'
  };

  // Adjust severity and messaging based on error type
  switch (code) {
    case 'UNAUTHORIZED':
    case 'MISSING_TOKEN':
      displayConfig.title = 'AI Service Configuration Issue';
      displayConfig.severity = 'error';
      displayConfig.contactAdmin = true;
      break;
      
    case 'RATE_LIMITED':
      displayConfig.title = 'Service Temporarily Busy';
      displayConfig.severity = 'info';
      displayConfig.canRetry = true;
      break;
      
    case 'NETWORK_ERROR':
      displayConfig.title = 'Connection Issue';
      displayConfig.severity = 'warning';
      displayConfig.canRetry = true;
      break;
      
    case 'SERVICE_UNAVAILABLE':
      displayConfig.title = 'AI Features Unavailable';
      displayConfig.severity = 'info';
      displayConfig.message = 'AI features are temporarily unavailable, but all other features work normally.';
      break;
  }

  return displayConfig;
}