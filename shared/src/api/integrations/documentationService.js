import { createSecureLogger } from '../../utils/secureLogger.js';
import { sanitizeErrorMessage } from '../../utils/tokenValidation.js';

// Create secure logger for this component
const logger = createSecureLogger('Documentation Service');

/**
 * Service for interacting with the documentation Q&A API
 */
class DocumentationService {
  constructor() {
    this.baseURL = '/api/documentation';
  }

  /**
   * Ask a question about the O7C Hub documentation
   * @param {string} question - The question to ask
   * @param {string} [additionalContext] - Additional context to include
   * @returns {Promise<Object>} Response with answer and metadata
   */
  async askQuestion(question, additionalContext = '') {
    try {
      logger.debug('Sending documentation question', {
        questionLength: question.length,
        hasAdditionalContext: !!additionalContext
      });

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          context: additionalContext
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

        logger.error('Documentation API request failed', {
          status: response.status,
          error: sanitizeErrorMessage(errorData.error || 'Unknown error'),
          errorCode: errorData.errorCode
        });

        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      logger.info('Documentation question answered successfully', {
        responseLength: data.answer?.length || 0,
        relevantSectionsCount: data.metadata?.relevantSections?.length || 0
      });

      return {
        success: true,
        answer: data.answer,
        metadata: data.metadata,
        model: data.model,
        generatedAt: data.generatedAt
      };

    } catch (error) {
      logger.error('Error asking documentation question', {
        error: sanitizeErrorMessage(error.message),
        question: question.substring(0, 100)
      });

      return {
        success: false,
        error: error.message,
        answer: null,
        metadata: null
      };
    }
  }

  /**
   * Get documentation statistics
   * @returns {Promise<Object>} Documentation knowledge base statistics
   */
  async getDocumentationStats() {
    try {
      // This would require a separate endpoint for stats
      // For now, return basic info
      return {
        success: true,
        stats: {
          lastUpdated: new Date().toISOString(),
          status: 'available'
        }
      };
    } catch (error) {
      logger.error('Error getting documentation stats', {
        error: sanitizeErrorMessage(error.message)
      });

      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }

  /**
   * Check if documentation service is available
   * @returns {Promise<boolean>} True if service is available
   */
  async isServiceAvailable() {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'test availability'
        }),
      });

      return response.ok;
    } catch (error) {
      logger.debug('Documentation service availability check failed', {
        error: sanitizeErrorMessage(error.message)
      });
      return false;
    }
  }
}

// Export singleton instance
export const documentationService = new DocumentationService();
export default documentationService;