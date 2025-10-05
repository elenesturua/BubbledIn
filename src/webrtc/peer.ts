/**
 * WebRTC Peer Connection Management
 * Handles peer connections, media streams, and audio routing
 */

import { signaling, type SignalingData, type Participant } from './signaling';
import { authService } from '../firebase/auth';
import { WEBRTC_CONFIG, FALLBACK_WEBRTC_CONFIG, CONNECTION_CONFIG, MEDIA_CONSTRAINTS } from './config';

export interface PeerConnection {
  peer: RTCPeerConnection;
  audioElement: HTMLAudioElement;
  stream?: MediaStream;
  participantId: string;
}

export interface PeerManagerCallbacks {
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onParticipantJoined?: (participantId: string) => void;
  onParticipantLeft?: (participantId: string) => void;
  onError?: (error: Error) => void;
  onDataChannelMessage?: (participantId: string, message: any) => void;
}

class PeerManager {
  private peers: Map<string, PeerConnection> = new Map();
  private localStream?: MediaStream;
  private callbacks: PeerManagerCallbacks = {};
  private currentRoomId?: string;
  private currentUserId?: string;
  private signalingUnsubscribes: (() => void)[] = [];
  private connectionRetryAttempts: Map<string, number> = new Map();
  private maxRetryAttempts = CONNECTION_CONFIG.maxRetryAttempts;
  private retryDelay = CONNECTION_CONFIG.retryDelay;

  /**
   * Initialize local media stream
   */
  async initializeLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
      return this.localStream;
    } catch (error) {
      console.error('❌ Failed to access microphone:', error);
      throw new Error(`Failed to access microphone: ${error}`);
    }
  }

  /**
   * Initialize peer connections for a room
   */
  async initializeRoom(roomId: string): Promise<void> {
    this.currentRoomId = roomId;
    this.currentUserId = authService.getCurrentUserId() || undefined;
    
    if (!this.currentUserId) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }

    // Set up signaling listeners for existing participants
    await this.setupSignalingListeners(roomId);
    
    // Start connection health monitoring
    this.startConnectionHealthCheck();
  }

  /**
   * Create a new peer connection
   */
  async createPeer(participantId: string, useFallback = false): Promise<PeerConnection> {
    // Use fallback config for retries, full config for initial attempts
    const configuration: RTCConfiguration = useFallback && FALLBACK_WEBRTC_CONFIG ? FALLBACK_WEBRTC_CONFIG : WEBRTC_CONFIG;

    const peer = new RTCPeerConnection(configuration);
    const audioElement = document.createElement('audio');
    audioElement.autoplay = true;
    audioElement.controls = false;
    audioElement.style.display = 'none';
    audioElement.muted = false;
    audioElement.volume = 1.0;

    // Add audio element to document
    document.body.appendChild(audioElement);

    const peerConnection: PeerConnection = {
      peer,
      audioElement,
      participantId
    };

    // Set up peer connection event handlers
    this.setupPeerEventHandlers(peerConnection, participantId);

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peer.addTrack(track, this.localStream!);
      });
    }

    this.peers.set(participantId, peerConnection);
    return peerConnection;
  }

  /**
   * Connect to a participant
   */
  async connectToParticipant(participantId: string): Promise<void> {
    if (!this.currentRoomId || !this.currentUserId) {
      console.error('❌ Room not initialized');
      throw new Error('Room not initialized');
    }

    console.log('🔗 Starting connection to participant:', participantId);
    console.log('   Current user ID:', this.currentUserId);
    console.log('   Room ID:', this.currentRoomId);

    // Check if connection already exists and is healthy
    if (this.peers.has(participantId)) {
      const existingPeer = this.peers.get(participantId);
      if (existingPeer && existingPeer.peer.connectionState === 'connected') {
        console.log('✅ Connection to participant already exists and is connected:', participantId);
        return;
      } else if (existingPeer) {
        console.log('🧹 Removing existing unhealthy connection to participant:', participantId);
        this.removePeer(participantId);
      }
    }

    // Reset retry attempts for new connection
    this.connectionRetryAttempts.delete(participantId);
    
    // Create peer connection
    console.log('🔧 Creating peer connection for:', participantId);
    const peerConnection = await this.createPeer(participantId);
    console.log('✅ Peer connection created for:', participantId);
    
    // Create offer
    console.log('📝 Creating offer for:', participantId);
    console.log('   Connection state before offer:', peerConnection.peer.connectionState);
    console.log('   Signaling state before offer:', peerConnection.peer.signalingState);
    
    // Check if connection is in a valid state for creating offers
    if (peerConnection.peer.signalingState === 'closed') {
      console.error('❌ Cannot create offer: connection is closed for participant:', participantId);
      throw new Error('Connection is closed');
    }
    
    const offer = await peerConnection.peer.createOffer();
    await peerConnection.peer.setLocalDescription(offer);
    console.log('✅ Offer created and set for:', participantId);
    
    // Send offer through signaling
    console.log('📤 Sending offer to:', participantId);
    await signaling.sendOffer(this.currentRoomId, this.currentUserId, participantId, offer);
    console.log('✅ Offer sent to:', participantId);
  }

  /**
   * Handle incoming offer
   */
  async handleOffer(fromId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.currentRoomId || !this.currentUserId) {
      console.error('❌ Room not initialized');
      throw new Error('Room not initialized');
    }

    console.log('📥 Received offer from:', fromId);

    // Check if peer connection already exists
    if (this.peers.has(fromId)) {
      console.log('⚠️ Peer connection already exists for:', fromId);
      return;
    }

    // Create peer connection
    console.log('🔧 Creating peer connection for offer from:', fromId);
    const peerConnection = await this.createPeer(fromId);
    console.log('✅ Peer connection created for offer from:', fromId);
    
    // Set remote description
    console.log('📝 Setting remote description for:', fromId);
    await peerConnection.peer.setRemoteDescription(offer);
    console.log('✅ Remote description set for:', fromId);
    
    // Create answer
    console.log('📝 Creating answer for:', fromId);
    const answer = await peerConnection.peer.createAnswer();
    await peerConnection.peer.setLocalDescription(answer);
    console.log('✅ Answer created and set for:', fromId);
    
    // Send answer through signaling
    console.log('📤 Sending answer to:', fromId);
    await signaling.sendAnswer(this.currentRoomId, this.currentUserId, fromId, answer);
    console.log('✅ Answer sent to:', fromId);
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(fromId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    console.log('📥 Received answer from:', fromId);
    
    const peerConnection = this.peers.get(fromId);
    if (peerConnection) {
      console.log('📝 Setting remote description for answer from:', fromId);
      await peerConnection.peer.setRemoteDescription(answer);
      console.log('✅ Remote description set for answer from:', fromId);
    } else {
      console.error('❌ No peer connection found for participant:', fromId);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(fromId: string, candidate: RTCIceCandidateInit): Promise<void> {
    console.log('🧊 Received ICE candidate from:', fromId);
    
    const peerConnection = this.peers.get(fromId);
    if (peerConnection) {
      console.log('🧊 Adding ICE candidate for:', fromId);
      await peerConnection.peer.addIceCandidate(candidate);
      console.log('✅ ICE candidate added for:', fromId);
    } else {
      console.error('❌ No peer connection found for ICE candidate from:', fromId);
    }
  }

  /**
   * Retry connection to a participant
   */
  private async retryConnection(participantId: string): Promise<void> {
    const currentAttempts = this.connectionRetryAttempts.get(participantId) || 0;
    
    if (currentAttempts >= this.maxRetryAttempts) {
      console.error('❌ Max retry attempts reached for participant:', participantId);
      this.callbacks.onError?.(new Error(`Failed to connect to participant ${participantId} after ${this.maxRetryAttempts} attempts`));
      return;
    }
    
    this.connectionRetryAttempts.set(participantId, currentAttempts + 1);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
    
    try {
      // Remove old peer connection
      const oldPeer = this.peers.get(participantId);
      if (oldPeer) {
        oldPeer.peer.close();
        oldPeer.audioElement.remove();
        this.peers.delete(participantId);
      }
      
      // Create new peer connection with fallback config for retries
      const useFallback = currentAttempts > 0;
      const peerConnection = await this.createPeer(participantId, useFallback);
      
      // Recreate offer/answer flow
      const offer = await peerConnection.peer.createOffer();
      await peerConnection.peer.setLocalDescription(offer);
      await signaling.sendOffer(this.currentRoomId!, this.currentUserId!, participantId, offer);
    } catch (error) {
      // Will retry again on next failure
    }
  }

  /**
   * Add remote stream to peer connection
   */
  addRemoteStream(participantId: string, stream: MediaStream): void {
    const peerConnection = this.peers.get(participantId);
    if (!peerConnection) {
      return;
    }

    // Add remote stream to audio element
    peerConnection.audioElement.srcObject = stream;
    peerConnection.stream = stream;
  }

  removePeer(participantId: string): void {
    const peerConnection = this.peers.get(participantId);
    if (!peerConnection) {
      return;
    }
    
    try {
      // Stop and detach audio element
      peerConnection.audioElement.pause();
      peerConnection.audioElement.srcObject = null;
      peerConnection.audioElement.load();
      
      if (peerConnection.audioElement.parentNode) {
        peerConnection.audioElement.parentNode.removeChild(peerConnection.audioElement);
      }
      
      // Stop all stream tracks
      if (peerConnection.stream) {
        peerConnection.stream.getTracks().forEach(track => track.stop());
        peerConnection.stream = undefined;
      }
      
      // Clean up senders and receivers
      const senders = peerConnection.peer.getSenders();
      senders.forEach(sender => {
        // Don't stop the track - just replace it with null to remove from this peer
        // The track should continue for other participants
        try {
          sender.replaceTrack(null);
        } catch (error) {
          // Ignore replace track errors
        }
      });
      
      const receivers = peerConnection.peer.getReceivers();
      receivers.forEach(receiver => {
        if (receiver.track) {
          receiver.track.stop();
        }
      });
      
      // Stop transceivers
      const transceivers = peerConnection.peer.getTransceivers();
      transceivers.forEach(transceiver => {
        try {
          transceiver.stop();
          transceiver.direction = 'inactive';
        } catch (error) {
          // Ignore transceiver stop errors
        }
      });
      
      // Close peer connection
      if (peerConnection.peer.connectionState !== 'closed') {
        peerConnection.peer.close();
      }
      
      this.peers.delete(participantId);
      this.callbacks.onParticipantLeft?.(participantId);
    } catch (error) {
      // Still remove from peers map even if cleanup failed
      this.peers.delete(participantId);
    }
  }

  /**
   * Mute/unmute local stream
   */
  setMuted(muted: boolean): void {
    console.log('🎤 PeerManager.setMuted called with:', muted);
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      console.log('🎤 Found', audioTracks.length, 'audio tracks');
      audioTracks.forEach((track, index) => {
        console.log(`🎤 Track ${index}: enabled=${track.enabled}, setting to ${!muted}`);
        track.enabled = !muted;
      });
    } else {
      console.log('🎤 No local stream available for muting');
    }
  }

  /**
   * Set volume for a specific participant
   */
  setParticipantVolume(participantId: string, volume: number): void {
    const peerConnection = this.peers.get(participantId);
    if (peerConnection) {
      peerConnection.audioElement.volume = volume / 100;
    }
  }

  /**
   * Get all peer connections
   */
  getPeers(): Map<string, PeerConnection> {
    return new Map(this.peers);
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | undefined {
    return this.localStream;
  }

  private removeLocalTracksFromAllPeers(): void {
    this.peers.forEach((peerConnection) => {
      const senders = peerConnection.peer.getSenders();
      senders.forEach(sender => {
        if (sender.track) {
          try {
            peerConnection.peer.removeTrack(sender);
          } catch (e) {
            // Ignore remove track errors
          }
        }
      });
    });
  }

  stopLocalStream(): void {
    this.removeLocalTracksFromAllPeers();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      this.localStream = undefined;
    }
  }

  private stopAllRemoteStreams(): void {
    this.peers.forEach((peerConnection) => {
      if (peerConnection.stream) {
        peerConnection.stream.getTracks().forEach(track => track.stop());
        peerConnection.stream = undefined;
      }
      
      peerConnection.audioElement.srcObject = null;
      peerConnection.audioElement.pause();
      peerConnection.audioElement.load();
    });
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: PeerManagerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Enable audio playback (call after user interaction)
   */
  enableAudio(): void {
    this.peers.forEach((peerConnection) => {
      if (peerConnection.audioElement) {
        peerConnection.audioElement.muted = false;
        peerConnection.audioElement.play().catch(() => {
          // Ignore play errors
        });
      }
    });
  }


  /**
   * Set up signaling listeners for a room
   */
  private async setupSignalingListeners(roomId: string): Promise<void> {
    if (!this.currentUserId) return;

    // Listen for all signaling data from other participants
    const signalingUnsubscribe = signaling.onAllSignaling(roomId, this.currentUserId, async (fromId: string, data: SignalingData) => {
      try {
        if (data.offer) {
          await this.handleOffer(fromId, data.offer);
        }
        if (data.answer) {
          await this.handleAnswer(fromId, data.answer);
        }
        if (data.iceCandidates && data.iceCandidates.length > 0) {
          for (const candidate of data.iceCandidates) {
            await this.handleIceCandidate(fromId, candidate);
          }
        }
      } catch (error) {
        // Ignore signaling errors
      }
    });

    this.signalingUnsubscribes.push(signalingUnsubscribe);
  }

  /**
   * Connect to all participants in the room
   */
  async connectToAllParticipants(participants: Participant[]): Promise<void> {
    if (!this.currentUserId) return;

    console.log('🔗 Connecting to all participants:', participants.length);
    
    for (const participant of participants) {
      if (participant.id !== this.currentUserId) {
        // Use handleNewParticipant to avoid duplicate connection logic
        try {
          console.log('🔗 Ensuring connection to participant:', participant.id);
          await this.handleNewParticipant(participant.id);
        } catch (error) {
          console.error('❌ Failed to connect to participant:', participant.id, error);
          // Connection failed, continue with other participants
        }
      }
    }
  }

  /**
   * Handle new participant joining
   */
  async handleNewParticipant(participantId: string): Promise<void> {
    if (!this.currentUserId || participantId === this.currentUserId) return;

    // Check if we already have a connection
    if (this.peers.has(participantId)) {
      const existingPeer = this.peers.get(participantId);
      if (existingPeer) {
        const connectionState = existingPeer.peer.connectionState;
        const iceConnectionState = existingPeer.peer.iceConnectionState;
        
        console.log('🔍 Existing connection to participant:', participantId);
        console.log('   Connection state:', connectionState);
        console.log('   ICE state:', iceConnectionState);
        
        // Only repair if connection is truly unhealthy
        if (connectionState === 'failed' || connectionState === 'closed' || 
            iceConnectionState === 'failed' || iceConnectionState === 'closed') {
          console.log('🔧 Connection is unhealthy, removing and reconnecting:', participantId);
          this.removePeer(participantId);
        } else {
          console.log('✅ Connection to participant is healthy:', participantId);
          return; // Don't create a new connection
        }
      }
    }

    try {
      console.log('🔗 Connecting to new participant:', participantId);
      await this.connectToParticipant(participantId);
    } catch (error) {
      console.error('❌ Failed to connect to new participant:', participantId, error);
      // Connection failed, continue
    }
  }

  /**
   * Handle participant leaving
   */
  handleParticipantLeft(participantId: string): void {
    if (this.peers.has(participantId)) {
      this.removePeer(participantId);
    }
  }

  /**
   * Start periodic connection health monitoring
   */
  private startConnectionHealthCheck(): void {
    // Check connection health every 30 seconds (less frequent to avoid interference)
    setInterval(() => {
      this.checkConnectionHealth();
    }, 30000);
  }

  /**
   * Check and repair unhealthy connections
   */
  private async checkConnectionHealth(): Promise<void> {
    if (!this.currentRoomId || !this.currentUserId) return;

    for (const [participantId, peerConnection] of this.peers) {
      const connectionState = peerConnection.peer.connectionState;
      const iceConnectionState = peerConnection.peer.iceConnectionState;
      
      // Check if connection is unhealthy
      if (connectionState === 'failed' || 
          connectionState === 'disconnected' || 
          iceConnectionState === 'failed' || 
          iceConnectionState === 'disconnected') {
        
        console.log('🔧 Unhealthy connection detected for participant:', participantId);
        console.log('   Connection state:', connectionState);
        console.log('   ICE state:', iceConnectionState);
        
        // Remove the unhealthy connection
        this.removePeer(participantId);
        
        // Attempt to reconnect
        try {
          console.log('🔄 Attempting to reconnect to participant:', participantId);
          await this.connectToParticipant(participantId);
        } catch (error) {
          console.error('❌ Failed to reconnect to participant:', participantId, error);
        }
      }
    }
  }

  sendDataChannelMessage(participantId: string, message: any): void {
    const peerConnection = this.peers.get(participantId);
    if (peerConnection && peerConnection.peer.connectionState === 'connected') {
      // Implementation would depend on data channel setup
    }
  }

  cleanup(): void {
    // Clear retry attempts
    this.connectionRetryAttempts.clear();
    
    this.stopAllRemoteStreams();
    
    const participantIds = Array.from(this.peers.keys());
    participantIds.forEach(participantId => {
      this.removePeer(participantId);
    });

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      this.localStream = undefined;
    }

    this.signalingUnsubscribes.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        // Ignore unsubscribe errors
      }
    });
    this.signalingUnsubscribes = [];

    this.currentRoomId = undefined;
    this.currentUserId = undefined;
    this.callbacks = {};
  }

  private setupPeerEventHandlers(peerConnection: PeerConnection, participantId: string): void {
    const { peer, audioElement } = peerConnection;

    // Handle incoming remote stream
    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;
      
      // Check if this is our own stream to prevent echo
      const isOwnStream = this.localStream && 
        remoteStream.getAudioTracks().some(track => 
          this.localStream!.getAudioTracks().some(localTrack => 
            localTrack.id === track.id
          )
        );
      
      if (isOwnStream || participantId === this.currentUserId) {
        // Don't play our own stream - prevents users from hearing themselves
        return;
      }
      
      // Set up audio element
      audioElement.srcObject = remoteStream;
      peerConnection.stream = remoteStream;
      
      // Ensure audio plays
      audioElement.muted = false;
      audioElement.volume = 1.0;
      
      // Try to play audio (handle autoplay restrictions)
      const playAudio = async () => {
        try {
          await audioElement.play();
        } catch (error) {
          // Audio will play when user interacts with the page
        }
      };
      
      playAudio();
      
      // Check if ICE connection should be considered connected
      if (peer.iceConnectionState === 'new' && peer.iceGatheringState === 'complete') {
        // Force ICE connection state check
        setTimeout(() => {
          if (peer.iceConnectionState === 'new') {
            // Manually trigger participant joined callback
            this.callbacks.onParticipantJoined?.(participantId);
          }
        }, 1000);
      }
    };

    // Handle ICE candidates
    peer.onicecandidate = async (event) => {
      if (event.candidate && this.currentRoomId && this.currentUserId) {
        try {
          await signaling.sendIceCandidate(this.currentRoomId, this.currentUserId, participantId, event.candidate);
        } catch (error) {
          console.error('Failed to send ICE candidate to:', participantId, error);
        }
      }
    };

    // Add ICE gathering timeout
    const iceTimeout = setTimeout(() => {
      if (peer.iceGatheringState !== 'complete') {
        console.warn('ICE gathering timeout for', participantId, 'state:', peer.iceGatheringState);
      }
    }, 10000); // 10 seconds

    // Clear timeout when ICE gathering completes
    peer.onicegatheringstatechange = () => {
      if (peer.iceGatheringState === 'complete') {
        clearTimeout(iceTimeout);
      }
    };

    // Handle connection state changes
    peer.onconnectionstatechange = () => {
      this.callbacks.onConnectionStateChange?.(peer.connectionState);
      
      if (peer.connectionState === 'connected') {
        // Reset retry attempts on successful connection
        this.connectionRetryAttempts.delete(participantId);
        this.callbacks.onParticipantJoined?.(participantId);
      } else if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
        this.callbacks.onParticipantLeft?.(participantId);
        
        // Retry connection if it failed
        if (peer.connectionState === 'failed') {
          this.retryConnection(participantId);
        }
      }
    };

    // Handle ICE connection state changes
    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === 'connected') {
        // Reset retry attempts on successful ICE connection
        this.connectionRetryAttempts.delete(participantId);
        this.callbacks.onParticipantJoined?.(participantId);
      } else if (peer.iceConnectionState === 'disconnected' || peer.iceConnectionState === 'failed') {
        this.callbacks.onParticipantLeft?.(participantId);
        
        // Retry connection if ICE failed
        if (peer.iceConnectionState === 'failed') {
          this.retryConnection(participantId);
        }
      }
    };

    // Add ICE connection state monitoring
    const checkIceState = () => {
      if (peer.iceConnectionState === 'new' && peer.iceGatheringState === 'complete') {
        // Force ICE connection check
        setTimeout(() => {
          if (peer.iceConnectionState === 'new') {
            this.callbacks.onParticipantJoined?.(participantId);
          }
        }, 2000);
      }
    };

    // Check ICE state after a delay
    setTimeout(checkIceState, 5000);

    // Handle ICE candidate errors
    peer.onicecandidateerror = (error) => {
      // Log STUN/TURN server errors as warnings (normal during ICE gathering)
      if (error.url && (error.url.includes('stun:') || error.url.includes('turn:'))) {
        return;
      }
      
      // Only log other ICE candidate errors as errors
      console.error('ICE candidate error for', participantId, ':', error.errorText);
      this.callbacks.onError?.(new Error(`ICE candidate failed: ${error.errorText}`));
    };

    // Handle data channel messages
    peer.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (event) => {
        this.callbacks.onDataChannelMessage?.(participantId, event.data);
      };
    };
  }
}

// Export singleton instance
export const peerManager = new PeerManager();

// Make peerManager available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).peerManager = peerManager;
}
