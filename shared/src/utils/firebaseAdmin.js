// Firebase Admin utilities for client-side admin operations
// These functions call server-side APIs that use Firebase Admin SDK

/**
 * Delete a Firebase Authentication user
 * @param {string} firebaseUid - Firebase UID
 * @param {string} userEmail - User email for logging
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function deleteFirebaseUser(firebaseUid, userEmail) {
  try {
    const response = await fetch('/api/firebase-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        firebaseUid,
        userEmail
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error calling Firebase user deletion API:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete Firebase user'
    };
  }
}

/**
 * Get Firebase user information
 * @param {string} firebaseUid - Firebase UID
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function getFirebaseUser(firebaseUid) {
  try {
    const response = await fetch('/api/firebase-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get',
        firebaseUid
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting Firebase user:', error);
    return {
      success: false,
      error: error.message || 'Failed to get Firebase user'
    };
  }
}

/**
 * Update Firebase user information
 * @param {string} firebaseUid - Firebase UID
 * @param {object} updates - User updates (email, displayName, disabled, etc.)
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function updateFirebaseUser(firebaseUid, updates) {
  try {
    const response = await fetch('/api/firebase-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        firebaseUid,
        updates
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating Firebase user:', error);
    return {
      success: false,
      error: error.message || 'Failed to update Firebase user'
    };
  }
}

/**
 * List Firebase users with pagination
 * @param {number} maxResults - Maximum number of results (default: 100)
 * @param {string} pageToken - Page token for pagination
 * @returns {Promise<{success: boolean, users?: array, pageToken?: string, error?: string}>}
 */
export async function listFirebaseUsers(maxResults = 100, pageToken = null) {
  try {
    const response = await fetch('/api/firebase-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'list',
        maxResults,
        pageToken
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error listing Firebase users:', error);
    return {
      success: false,
      error: error.message || 'Failed to list Firebase users'
    };
  }
}

/**
 * Set custom claims for a Firebase user
 * @param {string} firebaseUid - Firebase UID
 * @param {object} customClaims - Custom claims to set
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function setFirebaseCustomClaims(firebaseUid, customClaims) {
  try {
    const response = await fetch('/api/firebase-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'setCustomClaims',
        firebaseUid,
        customClaims
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error setting Firebase custom claims:', error);
    return {
      success: false,
      error: error.message || 'Failed to set Firebase custom claims'
    };
  }
}

/**
 * Disable/Enable Firebase user account
 * @param {string} firebaseUid - Firebase UID
 * @param {boolean} disabled - Whether to disable the account
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function setFirebaseUserDisabled(firebaseUid, disabled) {
  return updateFirebaseUser(firebaseUid, { disabled });
}

/**
 * Reset Firebase user password (sends password reset email)
 * @param {string} email - User email
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendFirebasePasswordReset(email) {
  try {
    const response = await fetch('/api/sendFirebasePasswordReset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending Firebase password reset:', error);
    return {
      success: false,
      error: error.message || 'Failed to send password reset email'
    };
  }
}