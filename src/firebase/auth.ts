/**
 * Firebase Authentication Service  
 * Handles user authentication for audio bubbles
 */

import { signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './config';

class AuthService {
  private currentUser: any = null;
  private authStateCallbacks: Array<(user: any) => void> = [];

  constructor() {
    // Set up auth state listener
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.authStateCallbacks.forEach(callback => callback(user));
    });
  }

  /**
   * Sign in anonymously
   */
  async signInAnonymously(): Promise<void> {
    try {
      await signInAnonymously(auth);
      console.log('✅ Signed in anonymously');
    } catch (error) {
      console.error('❌ Anonymous sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log('✅ Signed out');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): any {
    return this.currentUser;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: any) => void): () => void {
    this.authStateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateCallbacks.indexOf(callback);
      if (index > -1) {
        this.authStateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}

// Export singleton instance
export const authService = new AuthService();