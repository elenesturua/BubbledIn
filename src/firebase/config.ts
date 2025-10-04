/**
 * Firebase Configuration
 * Centralized Firebase setup for the application
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration (measurement ID is optional)
const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingConfig = requiredConfig
  .filter(key => !firebaseConfig[key as keyof typeof firebaseConfig])
  .map(key => `VITE_FIREBASE_${key.toUpperCase()}`);

if (missingConfig.length > 0) {
  console.warn('⚠️ Missing required Firebase configuration:', missingConfig);
  console.warn('📖 Please create a .env file with your Firebase credentials.\nSee README.md for setup instructions.');
} else {
  console.log('🔥 Firebase configuration loaded successfully!');
  console.log('🔥 Project ID:', firebaseConfig.projectId);
  console.log('🔥 Auth Domain:', firebaseConfig.authDomain);
  if (firebaseConfig.measurementId) {
    console.log('🔥 Measurement ID:', firebaseConfig.measurementId);
  } else {
    console.log('📊 Analytics measurement ID not provided (optional)');
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize analytics (optional)
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.log('📊 Analytics not available:', error.message);
  }
}

// Export the app instance for other uses
export default app;
export { analytics };