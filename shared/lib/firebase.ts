import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Debug: Check what environment variables are available
console.log('Environment variables check:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'SET' : 'MISSING',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'SET' : 'MISSING',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? 'SET' : 'MISSING',
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Firebase configuration loaded from environment variables

// Check if Firebase config is properly set
const isFirebaseConfigured = firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'demo-api-key' && 
  !firebaseConfig.apiKey.includes('your_actual') &&
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== 'demo-project';

let app, auth, db, storage, analytics;

if (isFirebaseConfigured) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    // Initialize Firebase Authentication and get a reference to the service
    auth = getAuth(app);
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Storage
    storage = getStorage(app);
    
    // Initialize Analytics (only in browser environment)
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    // Create mock objects for development
    auth = null;
    db = null;
    storage = null;
    analytics = null;
  }
} else {
  console.warn('Firebase not configured. Environment variables missing.');
  
  // In production, we should not use mock objects - this indicates a configuration error
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    console.error('PRODUCTION ERROR: Firebase environment variables are not configured!');
    console.error('Please set the following environment variables in Vercel:');
    console.error('- VITE_FIREBASE_API_KEY');
    console.error('- VITE_FIREBASE_AUTH_DOMAIN');
    console.error('- VITE_FIREBASE_PROJECT_ID');
    console.error('- VITE_FIREBASE_STORAGE_BUCKET');
    console.error('- VITE_FIREBASE_MESSAGING_SENDER_ID');
    console.error('- VITE_FIREBASE_APP_ID');
    console.error('- VITE_FIREBASE_MEASUREMENT_ID');
  }
  
  // Set to null to indicate Firebase is not available
  auth = null;
  db = null;
  storage = null;
  analytics = null;
}

export { auth, db, storage, analytics };
export default app;