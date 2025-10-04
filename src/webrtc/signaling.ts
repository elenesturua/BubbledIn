/**
 * WebRTC Signaling Service
 * Handles room creation, joining, and participant management via Firebase
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc,
  getDocs,
  setDoc,
  onSnapshot, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { authService } from '../firebase/auth';

export interface RoomData {
  id: string;
  name: string;
  host: boolean;
  settings: {
    pushToTalk: boolean;
    presenterMode: boolean;
    transcription: boolean;
  };
  url: string;
  isActive: boolean;
  createdAt?: any;
  hostId?: string;
}

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isPresenter: boolean;
  isSpeaking?: boolean;
  joinedAt?: any;
}

export type ParticipantUpdateCallback = (participants: Participant[]) => void;
export type RoomUpdateCallback = (room: RoomData | null) => void;

class SignalingService {
  private currentRoom: RoomData | null = null;
  private participants: Participant[] = [];
  private onParticipantsCallback: ParticipantUpdateCallback | null = null;
  private onRoomCallback: RoomUpdateCallback | null = null;

  /**
   * Create a new room
   */
  async createRoom(name: string, settings: RoomData['settings']): Promise<RoomData> {
    try {
      console.log('🏠 Creating room:', name);
      
      // Generate room ID
      const roomId = this.generateRoomId();
      
      // Ensure user is authenticated
      if (!authService.isAuthenticated()) {
        console.log('🔐 User not authenticated, signing in anonymously...');
        await authService.signInAnonymously();
      }

      const userId = authService.getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated after sign in');
        throw new Error('User not authenticated');
      }

      console.log('👤 User ID:', userId);

      const roomData: RoomData = {
        id: roomId,
        name,
        host: true,
        settings,
        url: `${window.location.origin}?room=${roomId}`,
        isActive: true,
        createdAt: serverTimestamp(),
        hostId: userId
      };

      // Create room document in Firebase
      console.log('📝 Saving room to Firebase...');
      const roomRef = doc(db, 'rooms', roomId);
      await setDoc(roomRef, roomData as any);

      // Add host as first participant
      console.log('👑 Adding host as first participant...');
      await this.addParticipant(roomId, userId, 'You', true);

      this.currentRoom = roomData;
      this.notifyRoomUpdate();
      console.log('✅ Room created successfully:', roomId);
      return roomData;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw new Error('Failed to create room');
    }
  }

  /**
   * Join an existing room by room ID
   */
  async joinRoom(roomId: string, participantName: string = 'Participant'): Promise<RoomData> {
    try {
      console.log('🚪 Joining room:', roomId, 'as:', participantName);
      // Ensure user is authenticated
      if (!authService.isAuthenticated()) {
        console.log('🔐 User not authenticated, signing in anonymously...');
        await authService.signInAnonymously();
      }

      const userId = authService.getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated after sign in');
        throw new Error('User not authenticated');
      }

      console.log('👤 User ID:', userId);
      // Check if room exists
      console.log('🔍 Fetching room data from Firebase...');
      const roomRef = doc(db, 'rooms', roomId.toUpperCase());
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        console.error('❌ Room not found:', roomId);
        throw new Error('Room not found');
      }

      const roomData = { ...roomSnap.data(), id: roomId.toUpperCase() } as RoomData;
      
      // Check if user is already a participant
      const participantRef = doc(db, 'rooms', roomId.toUpperCase(), 'participants', userId);
      const participantSnap = await getDoc(participantRef);
      
      if (!participantSnap.exists()) {
        // Add participant to room
        await this.addParticipant(roomId.toUpperCase(), userId, participantName, false);
      }
      
      this.currentRoom = roomData;
      this.notifyRoomUpdate();
      console.log('✅ Successfully joined room:', roomId);
      return roomData;
    } catch (error) {
      console.error('Failed to join room:', error);
      throw new Error('Failed to join room');
    }
  }

  /**
   * Leave current room
   */
  async leaveRoom(): Promise<void> {
    if (!this.currentRoom) return;

    try {
      const userId = authService.getCurrentUserId();
      if (userId) {
        // Remove participant from Firebase
        const participantRef = doc(db, 'rooms', this.currentRoom.id, 'participants', userId);
        await deleteDoc(participantRef);
        
        // Check if room should be deactivated
        await this.checkAndDeactivateRoom(this.currentRoom.id);
      }
      
      this.currentRoom = null;
      this.participants = [];
      this.onParticipantsCallback = null;
      this.onRoomCallback = null;
      
      console.log('✅ Left room successfully');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  }

  /**
   * Update participant mute status
   */
  async updateParticipantMute(participantId: string, isMuted: boolean): Promise<void> {
    if (!this.currentRoom) return;

    try {
      const participantRef = doc(db, 'rooms', this.currentRoom.id, 'participants', participantId);
      await updateDoc(participantRef, { isMuted });
    } catch (error) {
      console.error('Failed to update mute status:', error);
    }
  }

  /**
   * Update participant speaking status
   */
  async updateParticipantSpeaking(participantId: string, isSpeaking: boolean): Promise<void> {
    if (!this.currentRoom) return;

    try {
      const participantRef = doc(db, 'rooms', this.currentRoom.id, 'participants', participantId);
      await updateDoc(participantRef, { isSpeaking });
    } catch (error) {
      console.error('Failed to update speaking status:', error);
    }
  }

  /**
   * Subscribe to participant updates
   */
  onParticipants(roomId: string, callback: ParticipantUpdateCallback): () => void {
    const participantsRef = collection(db, 'rooms', roomId, 'participants');
    const q = query(participantsRef, orderBy('joinedAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          const participants = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Participant[];
          
          this.participants = participants;
          this.onParticipantsCallback = callback;
          callback(participants);
        } catch (error) {
          console.error('Error processing participant updates:', error);
        }
      },
      (error) => {
        console.error('Error in participant subscription:', error);
        // Don't call callback on error to prevent infinite loops
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to room updates
   */
  onRoomUpdate(roomId: string, callback: RoomUpdateCallback): () => void {
    const roomRef = doc(db, 'rooms', roomId);
    
    const unsubscribe = onSnapshot(roomRef, 
      (doc) => {
        try {
          if (doc.exists()) {
            const roomData = { ...doc.data(), id: doc.id } as RoomData;
            this.currentRoom = roomData;
            this.onRoomCallback = callback;
            callback(roomData);
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('Error processing room updates:', error);
        }
      },
      (error) => {
        console.error('Error in room subscription:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Get current room data
   */
  getCurrentRoom(): RoomData | null {
    return this.currentRoom;
  }

  /**
   * Get current participants
   */
  getParticipants(): Participant[] {
    return this.participants;
  }

  /**
   * Generate a room ID
   */
  private generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Add a participant to a room
   */
  private async addParticipant(roomId: string, userId: string, name: string, isHost: boolean): Promise<void> {
    const participantData: Participant = {
      id: userId,
      name,
      isHost,
      isMuted: false,
      isPresenter: false,
      isSpeaking: false,
      joinedAt: serverTimestamp()
    };

    const participantRef = doc(db, 'rooms', roomId, 'participants', userId);
    await setDoc(participantRef, participantData as any);
  }

  /**
   * Check if room has no participants and mark it as inactive
   */
  private async checkAndDeactivateRoom(roomId: string): Promise<void> {
    try {
      const participantsRef = collection(db, 'rooms', roomId, 'participants');
      const participantsSnapshot = await getDocs(participantsRef);
      
      if (participantsSnapshot.empty) {
        // Mark room as inactive
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, { 
          isActive: false,
          endedAt: serverTimestamp()
        });
        console.log('🏠 Room marked as inactive:', roomId);
      }
    } catch (error) {
      console.error('Error checking room deactivation:', error);
    }
  }

  /**
   * Notify listeners of room updates
   */
  private notifyRoomUpdate(): void {
    if (this.onRoomCallback && this.currentRoom) {
      this.onRoomCallback(this.currentRoom);
    }
  }
}

// Export singleton instance
export const signaling = new SignalingService();