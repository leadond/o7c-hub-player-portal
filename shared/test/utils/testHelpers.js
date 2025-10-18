// Test utilities for data synchronization testing

export const createTestUser = () => ({
  uid: `test-user-${Date.now()}`,
  email: `test${Date.now()}@example.com`,
  displayName: 'Test User',
  emailVerified: true
});

export const createTestPlayer = (overrides = {}) => ({
  id: `player-${Date.now()}`,
  firstName: 'Test',
  lastName: 'Player',
  email: `player${Date.now()}@example.com`,
  position: 'QB',
  graduationYear: 2025,
  stars: 4,
  recruitingStatus: 'interested',
  ...overrides
});

export const createTestFile = (overrides = {}) => ({
  id: `file-${Date.now()}`,
  name: 'test_video.mp4',
  url: `https://storage.example.com/files/test_video_${Date.now()}.mp4`,
  uploadedAt: new Date().toISOString(),
  size: 1024000,
  type: 'video/mp4',
  ...overrides
});

export const waitForSync = (timeout = 5000) => {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
};

export const mockApiResponse = (data, delay = 100) => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay);
  });
};

export const simulateNetworkDelay = (min = 50, max = 200) => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

export const createConcurrentOperations = (operations, concurrency = 3) => {
  const results = [];
  const executing = [];

  for (const operation of operations) {
    const promise = Promise.resolve().then(() => operation());
    results.push(promise);

    if (operations.length >= concurrency) {
      executing.push(promise);
    }
  }

  return Promise.all(results);
};

export const validateDataConsistency = (originalData, updatedData, expectedChanges) => {
  const changes = Object.keys(expectedChanges);

  changes.forEach(key => {
    if (updatedData[key] !== expectedChanges[key]) {
      throw new Error(`Data consistency check failed for ${key}. Expected: ${expectedChanges[key]}, Got: ${updatedData[key]}`);
    }
  });

  // Ensure other fields remain unchanged
  Object.keys(originalData).forEach(key => {
    if (!changes.includes(key) && updatedData[key] !== originalData[key]) {
      throw new Error(`Unexpected change in field ${key}. Original: ${originalData[key]}, Updated: ${updatedData[key]}`);
    }
  });

  return true;
};

export const generateTestData = (count, factory) => {
  return Array.from({ length: count }, (_, index) => factory(index));
};

export const cleanupTestData = async (entities) => {
  const cleanupPromises = entities.map(async (entity) => {
    try {
      if (entity.id) {
        await entity.constructor.delete(entity.id);
      }
    } catch (error) {
      console.warn(`Failed to cleanup test entity ${entity.id}:`, error);
    }
  });

  await Promise.all(cleanupPromises);
};