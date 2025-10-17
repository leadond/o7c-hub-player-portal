// Base44 HTTP client for data operations via Vercel API proxy

const BASE_URL = '';
const PROXY_URL = '/api/base44';

const makeRequest = async (method, url, body = null) => {
  // Parse URL to extract path and query parameters
  const urlObj = new URL(url, 'http://dummy.com'); // Use dummy base for relative URLs
  const path = urlObj.pathname;
  const query = {};
  urlObj.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const proxyBody = {
    method,
    path,
    query: Object.keys(query).length > 0 ? query : undefined,
    body
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(proxyBody)
  };

  console.log(`[Base44 Proxy] ${method} ${path}`);
  if (body) {
    console.log('[Base44 Proxy] Request body:', body);
  }

  try {
    const response = await fetch(PROXY_URL, options);
    console.log(`[Base44 Proxy] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Base44 Proxy] Error response:', errorData);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
    }

    if (method === 'DELETE') {
      console.log('[Base44 Proxy] DELETE successful');
      return true;
    }

    const data = await response.json();
    console.log('[Base44 Proxy] Response data:', data);
    return data;
  } catch (error) {
    console.error('[Base44 Proxy] Request failed:', error);
    throw error;
  }
};

// Helper function to sort array client-side based on sort parameter
const sortArray = (array, sort) => {
  if (!sort || !Array.isArray(array)) return array;

  const isDescending = sort.startsWith('-');
  const field = isDescending ? sort.slice(1) : sort;

  return array.sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    // Handle null/undefined
    if (valA == null && valB == null) return 0;
    if (valA == null) return isDescending ? 1 : -1;
    if (valB == null) return isDescending ? -1 : 1;

    // Try numeric comparison
    const numA = Number(valA);
    const numB = Number(valB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return isDescending ? numB - numA : numA - numB;
    }

    // String comparison
    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    const comparison = strA.localeCompare(strB);
    return isDescending ? -comparison : comparison;
  });
};

// Create a Base44-based client that mimics the original structure
export const firebaseClient = {
  entities: {},
  auth: {},
  integrations: {}
};

// List of entities to create operations for
const entities = [
  'Player',
  'School',
  'Contact',
  'TeamHistory',
  'Tournament',
  'TournamentParticipation',
  'PlayerImage',
  'Team',
  'Coach',
  'CoachAssignment',
  'ParentPlayerAssignment',
  'Payment',
  'AdditionalFee',
  'PaymentMethod',
  'TeamFee',
  'RecruitingInterest',
  'AppUser',
  'Notification'
];

// Helper function to create entity operations
const createEntityOperations = (entityName) => {
  const baseUrl = `${BASE_URL}/${entityName}`;

  return {
    list: async (orderByField = null, limitCount = null) => {
      const params = new URLSearchParams();
      if (limitCount) {
        params.append('limit', limitCount.toString());
      }
      const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
      const response = await makeRequest('GET', url);
      // Handle Base44 API response structure - if it's an object with data property, return the data array
      let data = response && typeof response === 'object' && response.data ? response.data : response;
      // Apply client-side sorting if orderByField is provided
      if (orderByField) {
        data = sortArray(data, orderByField);
      }
      return data;
    },

    filter: async (filters = {}, limitCount = null, sort = null) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params.append(key, value.toString());
        }
      });
      if (limitCount) {
        params.append('limit', limitCount.toString());
      }
      const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
      const response = await makeRequest('GET', url);
      // Handle Base44 API response structure - if it's an object with data property, return the data array
      let data = response && typeof response === 'object' && response.data ? response.data : response;
      // Apply client-side sorting if sort is provided
      if (sort) {
        data = sortArray(data, sort);
      }
      return data;
    },

    get: async (id) => {
      const url = `${baseUrl}/${id}`;
      return makeRequest('GET', url);
    },

    create: async (data) => {
      return makeRequest('POST', baseUrl, data);
    },

    update: async (id, data) => {
      const url = `${baseUrl}/${id}`;
      return makeRequest('PUT', url, data);
    },

    delete: async (id) => {
      const url = `${baseUrl}/${id}`;
      return makeRequest('DELETE', url);
    },

    bulkCreate: async (items) => {
      const results = [];
      for (const item of items) {
        const result = await this.create(item);
        results.push(result);
      }
      return results;
    }
  };
};

// Create entity operations for each entity
entities.forEach(entityName => {
  firebaseClient.entities[entityName] = createEntityOperations(entityName);
});

// Add generic methods for compatibility (used by PlayerImage.js)
firebaseClient.entities.get = async (path, filters = {}, sort = null) => {
  const url = `${BASE_URL}${path}`;
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, value.toString());
    }
  });
  const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
  const response = await makeRequest('GET', fullUrl);
  // Handle Base44 API response structure - if it's an object with data property, return the data array
  let data = response && typeof response === 'object' && response.data ? response.data : response;
  // Apply client-side sorting if sort is provided and data is an array
  if (sort && Array.isArray(data)) {
    data = sortArray(data, sort);
  }
  return data;
};

firebaseClient.entities.put = async (path, data) => {
  const url = `${BASE_URL}${path}`;
  return makeRequest('PUT', url, data);
};

// For backward compatibility, export as base44
export const base44 = firebaseClient;
