// Test file for Base44 API proxy endpoint
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the handler function
const mockHandler = vi.fn();

// Mock fetch globally
global.fetch = vi.fn();

describe('Base44 API Proxy', () => {
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Import the handler dynamically to avoid module caching issues
    const module = await import('../base44.js');
    handler = module.default;

    // Mock request object
    mockReq = {
      method: 'POST',
      body: {
        method: 'GET',
        path: '/Player',
        query: { limit: '10' }
      }
    };

    // Mock response object
    mockRes = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis()
    };
  });

  it('should handle OPTIONS request for CORS preflight', async () => {
    mockReq.method = 'OPTIONS';
    
    await handler(mockReq, mockRes);
    
    expect(mockRes.setHeader).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.end).toHaveBeenCalled();
  });

  it('should reject non-POST requests', async () => {
    mockReq.method = 'GET';
    
    await handler(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Method not allowed',
      message: 'Only POST requests are allowed for the Base44 proxy'
    });
  });

  it('should validate request body structure', async () => {
    mockReq.body = null;
    
    await handler(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid request',
      message: 'Request body is required and must be an object'
    });
  });

  it('should validate required method field', async () => {
    mockReq.body = { path: '/Player' };
    
    await handler(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid request',
      message: 'Method is required and must be a string'
    });
  });

  it('should validate allowed HTTP methods', async () => {
    mockReq.body = { method: 'PATCH', path: '/Player' };
    
    await handler(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid request',
      message: 'Method must be one of: GET, POST, PUT, DELETE'
    });
  });

  it('should validate path format', async () => {
    mockReq.body = { method: 'GET', path: 'Player' };
    
    await handler(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid request',
      message: 'Path must start with /'
    });
  });

  it('should successfully proxy GET request', async () => {
    const mockResponse = { data: [{ id: 1, name: 'Test Player' }] };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        get: vi.fn().mockReturnValue('application/json')
      },
      json: vi.fn().mockResolvedValue(mockResponse)
    });
    
    await handler(mockReq, mockRes);
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.base44.com/api/Player?limit=10',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it('should handle POST request with body', async () => {
    mockReq.body = {
      method: 'POST',
      path: '/Player',
      body: { name: 'New Player', age: 18 }
    };
    
    const mockResponse = { id: 2, name: 'New Player', age: 18 };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      statusText: 'Created',
      headers: {
        get: vi.fn().mockReturnValue('application/json')
      },
      json: vi.fn().mockResolvedValue(mockResponse)
    });
    
    await handler(mockReq, mockRes);
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.base44.com/api/Player',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New Player', age: 18 })
      })
    );
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it('should handle DELETE request', async () => {
    mockReq.body = {
      method: 'DELETE',
      path: '/Player/123'
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'No Content',
      headers: {
        get: vi.fn().mockReturnValue('application/json')
      },
      json: vi.fn().mockResolvedValue({})
    });
    
    await handler(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
  });

  it('should handle API errors', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: {
        get: vi.fn().mockReturnValue('application/json')
      },
      json: vi.fn().mockResolvedValue({ message: 'Player not found' })
    });
    
    await handler(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Base44 API Error',
      message: 'Player not found',
      status: 404
    });
  });

  it('should handle network errors', async () => {
    global.fetch.mockRejectedValueOnce(new TypeError('fetch failed'));
    
    await handler(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(503);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Service unavailable',
      message: 'Unable to connect to Base44 API'
    });
  });

  it('should set proper CORS and security headers', async () => {
    await handler(mockReq, mockRes);
    
    expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
  });
});