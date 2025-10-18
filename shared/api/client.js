// This client is deprecated. Use Firebase Firestore operations instead.
// Keeping for backward compatibility but pointing to a placeholder URL.
const BASE_URL = 'https://deprecated-api.example.com';
const API_KEY = 'deprecated';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const shouldRetry = (error, attempt) => {
  if (attempt >= MAX_RETRIES) return false;

  // Retry on network errors or 5xx status codes
  if (!error.status) return true; // Network error
  return error.status >= 500;
};

const makeRequest = async (url, options = {}, attempt = 1) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (shouldRetry(error, attempt)) {
      await delay(RETRY_DELAY * attempt);
      return makeRequest(url, options, attempt + 1);
    }
    throw error;
  }
};

export const apiClient = {
  get: (endpoint, params = {}) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    return makeRequest(url.toString());
  },

  put: (endpoint, data) => {
    return makeRequest(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  post: (endpoint, data) => {
    return makeRequest(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: (endpoint) => {
    return makeRequest(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
  },
};

export { ApiError };