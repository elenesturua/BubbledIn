/**
 * Firebase Configuration
 * Centralized Firebase setup for the application
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCxGaiQ6YF0imcNLzhwLA408__YoWz6F3o',
  authDomain: 'bubbledin-c4ff0.firebaseapp.com',
  projectId: 'bubbledin-c4ff0',
  storageBucket: 'bubbledin-c4ff0.firebasestorage.app',
  messagingSenderId: '724646441543',
  appId: '1:724646441543:web:2697cc9f261ea499e1f762',
  measurementId: 'G-2NQZ1MVEHK'
};

console.log('🔥 Firebase configuration loaded successfully!');

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