/**
 * Real-time Transcription Service
 * Uses Web Speech API (browser built-in) for speech-to-text
 * Each participant's audio is transcribed and synced to all room members via Firestore
 */

import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { authService } from '../firebase/auth';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface TranscriptionEntry {
  id?: string;
  roomId: string;
  userId: string;
  userName: string;
  text: string;
  confidence: number;
  timestamp: any;
  isFinal: boolean;
  language?: string;
}

class TranscriptionService {
  private recognition: any = null;
  private isRecording = false;
  private currentRoomId: string | null = null;
  private currentUserName: string | null = null;
  private currentUserId: string | null = null;

  /**
   * Start capturing audio for transcription using Web Speech API
   */
  async startTranscription(roomId: string, userName: string, stream: MediaStream): Promise<void> {
    this.currentRoomId = roomId;
    this.currentUserName = userName;
    this.currentUserId = authService.getCurrentUserId();

    try {
      // Check if Web Speech API is supported
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.warn('⚠️ Web Speech API not supported in this browser');
        throw new Error('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      }

      // Initialize speech recognition
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      // Handle results
      this.recognition.onresult = async (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0.85;
          const isFinal = result.isFinal;

          if (isFinal && transcript.trim()) {
            // Save final transcription to Firestore
            await this.saveTranscription({
              roomId: this.currentRoomId!,
              userId: this.currentUserId!,
              userName: this.currentUserName!,
              text: transcript.trim(),
              confidence: confidence,
              isFinal: true,
              language: 'en-US'
            });
            
            console.log('✅ Transcription saved:', transcript.trim());
          }
        }
      };

      // Handle errors
      this.recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          // Restart after no speech detected
          if (this.isRecording) {
            setTimeout(() => {
              try {
                this.recognition?.start();
              } catch (e) {
                // Already started
              }
            }, 100);
          }
        }
      };

      // Handle end
      this.recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        // Restart if still recording
        if (this.isRecording) {
          try {
            this.recognition?.start();
          } catch (e) {
            // Already started
          }
        }
      };

      // Start recognition
      this.recognition.start();
      this.isRecording = true;
      
      console.log('✅ Web Speech API transcription started for room:', roomId);
    } catch (error) {
      console.error('❌ Failed to start transcription:', error);
      throw error;
    }
  }

  /**
   * Save transcription to Firestore (syncs to all participants)
   */
  private async saveTranscription(entry: Omit<TranscriptionEntry, 'id' | 'timestamp'>): Promise<void> {
    if (!this.currentRoomId) return;

    try {
      const transcriptionsRef = collection(db, 'rooms', this.currentRoomId, 'transcriptions');
      await addDoc(transcriptionsRef, {
        ...entry,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Failed to save transcription:', error);
    }
  }

  /**
   * Stop transcription
   */
  stopTranscription(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
        this.recognition = null;
      } catch (error) {
        console.warn('⚠️ Error stopping recognition:', error);
      }
    }

    this.isRecording = false;
    this.currentRoomId = null;
    this.currentUserName = null;
    this.currentUserId = null;
    console.log('✅ Transcription stopped');
  }

  /**
   * Listen to transcriptions for a room (real-time sync)
   * This allows all participants to see everyone's transcriptions
   */
  onTranscriptions(roomId: string, callback: (transcriptions: TranscriptionEntry[]) => void): () => void {
    const transcriptionsRef = collection(db, 'rooms', roomId, 'transcriptions');
    const q = query(transcriptionsRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const transcriptions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TranscriptionEntry[];

        callback(transcriptions);
      },
      (error) => {
        console.error('❌ Error listening to transcriptions:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Add a manual transcription entry (for testing)
   */
  async addTranscription(entry: Omit<TranscriptionEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const transcriptionsRef = collection(db, 'rooms', entry.roomId, 'transcriptions');
      await addDoc(transcriptionsRef, {
        ...entry,
        timestamp: serverTimestamp()
      });
      console.log('✅ Manual transcription added');
    } catch (error) {
      console.error('❌ Failed to add transcription:', error);
      throw error;
    }
  }

  /**
   * Check if currently recording
   */
  isRecordingActive(): boolean {
    return this.isRecording;
  }
}

export const transcriptionService = new TranscriptionService();

