/**
 * WebRTC Signaling Service
 * Handles room creation, joining, and participant management via Firebase
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
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

export interface SignalingData {
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  iceCandidates: RTCIceCandidateInit[];
  timestamp: any;
}

export type ParticipantUpdateCallback = (participants: Participant[]) => void;
export type RoomUpdateCallback = (room: RoomData | null) => void;
export type SignalingCallback = (data: SignalingData) => void;

class SignalingService {
  private participants: Participant[] = [];
  private onParticipantsCallback?: ParticipantUpdateCallback;
  private onRoomUpdateCallback?: RoomUpdateCallback;
  private currentRoom: RoomData | null = null;
  private unsubscribeCallbacks: (() => void)[] = [];

  /**
   * Create a new room with the given settings
   */
  async createRoom(roomName: string, settings: RoomData['settings']): Promise<RoomData> {
    try {
      // Ensure user is authenticated
      if (!authService.isAuthenticated()) {
        await authService.signInAnonymously();
      }

      const roomId = this.generateRoomId();
      const userId = authService.getCurrentUserId();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const roomData: RoomData = {
        id: roomId,
        name: roomName,
        host: true,
        settings,
        url: `${window.location.origin}?room=${roomId}`,
        createdAt: serverTimestamp(),
        hostId: userId
      };

      // Create room document in Firebase
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, roomData as any).catch(async () => {
        // If document doesn't exist, create it
        await addDoc(collection(db, 'rooms'), { ...roomData, id: roomId } as any);
      });

      // Add host as first participant
      await this.addParticipant(roomId, userId, 'You', true);

      this.currentRoom = roomData;
      this.notifyRoomUpdate();

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
      // Ensure user is authenticated
      if (!authService.isAuthenticated()) {
        await authService.signInAnonymously();
      }

      const userId = authService.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Check if room exists
      const roomRef = doc(db, 'rooms', roomId.toUpperCase());
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }

      const roomData = { ...roomSnap.data(), id: roomId.toUpperCase() } as RoomData;
      
      // Add participant to room
      await this.addParticipant(roomId.toUpperCase(), userId, participantName, false);
      
      this.currentRoom = roomData;
      this.notifyRoomUpdate();

      return roomData;
    } catch (error) {
      console.error('Failed to join room:', error);
      throw new Error('Failed to join room');
    }
  }

  /**
   * Leave the current room
   */
  async leaveRoom(): Promise<void> {
    if (!this.currentRoom) return;

    try {
      const userId = authService.getCurrentUserId();
      if (userId) {
        // Remove participant from Firebase
        const participantRef = doc(db, 'rooms', this.currentRoom.id, 'participants', userId);
        await deleteDoc(participantRef);
      }
    } catch (error) {
      console.error('Failed to leave room:', error);
    } finally {
      // Cleanup local state
      this.cleanup();
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
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const participants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Participant[];
      
      this.participants = participants;
      callback(participants);
    });

    this.unsubscribeCallbacks.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to room updates
   */
  onRoomUpdate(roomId: string, callback: RoomUpdateCallback): () => void {
    const roomRef = doc(db, 'rooms', roomId);
    
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = { ...snapshot.data(), id: snapshot.id } as RoomData;
        this.currentRoom = roomData;
        callback(roomData);
      } else {
        this.currentRoom = null;
        callback(null);
      }
    });

    this.unsubscribeCallbacks.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Send WebRTC offer
   */
  async sendOffer(roomId: string, fromId: string, toId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const signalingRef = doc(db, 'rooms', roomId, 'signaling', `${fromId}_${toId}`);
      await updateDoc(signalingRef, {
        offer,
        timestamp: serverTimestamp()
      }).catch(async () => {
        // Create document if it doesn't exist
        await addDoc(collection(db, 'rooms', roomId, 'signaling'), {
          id: `${fromId}_${toId}`,
          offer,
          iceCandidates: [],
          timestamp: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Failed to send offer:', error);
      throw error;
    }
  }

  /**
   * Send WebRTC answer
   */
  async sendAnswer(roomId: string, fromId: string, toId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const signalingRef = doc(db, 'rooms', roomId, 'signaling', `${fromId}_${toId}`);
      await updateDoc(signalingRef, {
        answer,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to send answer:', error);
      throw error;
    }
  }

  /**
   * Send ICE candidate
   */
  async sendIceCandidate(roomId: string, fromId: string, toId: string, candidate: RTCIceCandidateInit): Promise<void> {
    try {
      const signalingRef = doc(db, 'rooms', roomId, 'signaling', `${fromId}_${toId}`);
      await updateDoc(signalingRef, {
        iceCandidates: arrayUnion(candidate),
        timestamp: serverTimestamp()
      }).catch(async () => {
        // Create document if it doesn't exist
        await addDoc(collection(db, 'rooms', roomId, 'signaling'), {
          id: `${fromId}_${toId}`,
          iceCandidates: [candidate],
          timestamp: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Failed to send ICE candidate:', error);
      throw error;
    }
  }

  /**
   * Listen for signaling data
   */
  onSignaling(roomId: string, fromId: string, toId: string, callback: SignalingCallback): () => void {
    const signalingRef = doc(db, 'rooms', roomId, 'signaling', `${fromId}_${toId}`);
    
    const unsubscribe = onSnapshot(signalingRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SignalingData;
        callback(data);
      }
    });

    this.unsubscribeCallbacks.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Get current participants
   */
  getParticipants(): Participant[] {
    return [...this.participants];
  }

  /**
   * Get current room
   */
  getCurrentRoom(): RoomData | null {
    return this.currentRoom;
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks = [];
    this.participants = [];
    this.currentRoom = null;
    this.notifyParticipants();
    this.notifyRoomUpdate();
  }

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
    await updateDoc(participantRef, participantData as any).catch(async () => {
      // Create document if it doesn't exist
      await addDoc(collection(db, 'rooms', roomId, 'participants'), participantData as any);
    });
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private notifyParticipants(): void {
    if (this.onParticipantsCallback) {
      this.onParticipantsCallback([...this.participants]);
    }
  }

  private notifyRoomUpdate(): void {
    if (this.onRoomUpdateCallback) {
      this.onRoomUpdateCallback(this.currentRoom);
    }
  }
}

// Export singleton instance
export const signaling = new SignalingService();
