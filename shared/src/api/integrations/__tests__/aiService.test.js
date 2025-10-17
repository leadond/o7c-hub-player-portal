import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invokeLLM, isAIServiceAvailable, handleAIResponse, shouldUseFallback } from '../aiService.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('AI Service Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('invokeLLM error handling', () => {
    it('should handle 401 authentication errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          errorCode: 'UNAUTHORIZED',
          message: 'Invalid API token',
          troubleshooting: {
            steps: ['Check your API token', 'Renew expired token']
          }
        })
      });

      const result = await invokeLLM({
        prompt: 'test prompt',
        gracefulFallback: false
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('UNAUTHORIZED');
      expect(result.userMessage).toBe('Invalid API token');
    });

    it('should provide fallback response for authentication errors when gracefulFallback is true', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          errorCode: 'UNAUTHORIZED',
          message: 'Invalid API token'
        })
      });

      const result = await invokeLLM({
        prompt: 'test prompt',
        gracefulFallback: true
      });

      expect(result.success).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.errorCode).toBe('SERVICE_UNAVAILABLE');
    });

    it('should handle network errors with fallback', async () => {
      fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await invokeLLM({
        prompt: 'test prompt',
        gracefulFallback: true
      });

      expect(result.success).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.errorCode).toBe('SERVICE_UNAVAILABLE');
    });

    it('should handle rate limiting errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          errorCode: 'RATE_LIMITED',
          message: 'Too many requests'
        })
      });

      const result = await invokeLLM({
        prompt: 'test prompt',
        gracefulFallback: false
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('RATE_LIMITED');
      expect(result.userMessage).toBe('Too many requests');
    });
  });

  describe('isAIServiceAvailable', () => {
    it('should return operational status for successful response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await isAIServiceAvailable();

      expect(result.available).toBe(true);
      expect(result.status).toBe('operational');
    });

    it('should detect authentication errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          errorCode: 'UNAUTHORIZED',
          message: 'Invalid token'
        })
      });

      const result = await isAIServiceAvailable();

      expect(result.available).toBe(false);
      expect(result.status).toBe('authentication_error');
      expect(result.errorCode).toBe('UNAUTHORIZED');
    });

    it('should detect missing configuration', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          errorCode: 'MISSING_TOKEN',
          message: 'Token not configured'
        })
      });

      const result = await isAIServiceAvailable();

      expect(result.available).toBe(false);
      expect(result.status).toBe('not_configured');
    });
  });

  describe('handleAIResponse', () => {
    it('should handle successful responses', () => {
      const response = {
        success: true,
        response: 'AI generated content',
        model: 'gpt2',
        tokens: { total: 10 }
      };

      const result = handleAIResponse(response);

      expect(result.success).toBe(true);
      expect(result.content).toBe('AI generated content');
    });

    it('should handle error responses with user-friendly messaging', () => {
      const response = {
        success: false,
        errorCode: 'UNAUTHORIZED',
        userMessage: 'Authentication failed',
        troubleshooting: { steps: ['Check token'] }
      };

      const result = handleAIResponse(response);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNAUTHORIZED');
      expect(result.error.message).toBe('Authentication failed');
    });
  });

  describe('shouldUseFallback', () => {
    it('should return true for authentication errors', () => {
      expect(shouldUseFallback('UNAUTHORIZED')).toBe(true);
      expect(shouldUseFallback('MISSING_TOKEN')).toBe(true);
    });

    it('should return true for network errors', () => {
      expect(shouldUseFallback('NETWORK_ERROR')).toBe(true);
      expect(shouldUseFallback('SERVICE_UNAVAILABLE')).toBe(true);
    });

    it('should return false for user input errors', () => {
      expect(shouldUseFallback('BAD_REQUEST')).toBe(false);
      expect(shouldUseFallback('INVALID_INPUT')).toBe(false);
    });
  });
});