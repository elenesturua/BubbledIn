/**
 * WebRTC Peer Connection Management
 * Handles peer connections, media streams, and audio routing
 */

import { signaling, type SignalingData, type Participant } from './signaling';
import { authService } from '../firebase/auth';

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

  /**
   * Initialize local media stream
   */
  async initializeLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      return this.localStream;
    } catch (error) {
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
      throw new Error('User not authenticated');
    }

    // Set up signaling listeners for existing participants
    await this.setupSignalingListeners(roomId);
  }

  /**
   * Create a new peer connection
   */
  async createPeer(participantId: string): Promise<PeerConnection> {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peer = new RTCPeerConnection(configuration);
    const audioElement = document.createElement('audio');
    audioElement.autoplay = true;
    audioElement.controls = false;
    audioElement.style.display = 'none';

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
      throw new Error('Room not initialized');
    }

    // Create peer connection
    const peerConnection = await this.createPeer(participantId);
    
    // Create offer
    const offer = await peerConnection.peer.createOffer();
    await peerConnection.peer.setLocalDescription(offer);
    
    // Send offer through signaling
    await signaling.sendOffer(this.currentRoomId, this.currentUserId, participantId, offer);
  }

  /**
   * Handle incoming offer
   */
  async handleOffer(fromId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.currentRoomId || !this.currentUserId) {
      throw new Error('Room not initialized');
    }

    // Create peer connection
    const peerConnection = await this.createPeer(fromId);
    
    // Set remote description
    await peerConnection.peer.setRemoteDescription(offer);
    
    // Create answer
    const answer = await peerConnection.peer.createAnswer();
    await peerConnection.peer.setLocalDescription(answer);
    
    // Send answer through signaling
    await signaling.sendAnswer(this.currentRoomId, this.currentUserId, fromId, answer);
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(fromId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peers.get(fromId);
    if (peerConnection) {
      await peerConnection.peer.setRemoteDescription(answer);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(fromId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.peers.get(fromId);
    if (peerConnection) {
      await peerConnection.peer.addIceCandidate(candidate);
    }
  }

  /**
   * Add remote stream to peer connection
   */
  addRemoteStream(participantId: string, stream: MediaStream): void {
    const peerConnection = this.peers.get(participantId);
    if (!peerConnection) {
      console.warn(`No peer connection found for participant ${participantId}`);
      return;
    }

    // Add remote stream to audio element
    peerConnection.audioElement.srcObject = stream;
    peerConnection.stream = stream;

    // Add tracks to peer connection
    stream.getTracks().forEach(track => {
      peerConnection.peer.addTrack(track, stream);
    });
  }

  /**
   * Remove peer connection
   */
  removePeer(participantId: string): void {
    const peerConnection = this.peers.get(participantId);
    if (peerConnection) {
      // Close peer connection
      peerConnection.peer.close();
      
      // Remove audio element
      if (peerConnection.audioElement.parentNode) {
        peerConnection.audioElement.parentNode.removeChild(peerConnection.audioElement);
      }
      
      this.peers.delete(participantId);
      this.callbacks.onParticipantLeft?.(participantId);
    }
  }

  /**
   * Mute/unmute local stream
   */
  setMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
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

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: PeerManagerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
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
        console.error(`Error handling signaling from ${fromId}:`, error);
      }
    });

    this.signalingUnsubscribes.push(signalingUnsubscribe);
  }

  /**
   * Connect to all participants in the room
   */
  async connectToAllParticipants(participants: Participant[]): Promise<void> {
    if (!this.currentUserId) return;

    for (const participant of participants) {
      if (participant.id !== this.currentUserId && !this.peers.has(participant.id)) {
        try {
          await this.connectToParticipant(participant.id);
          console.log(`Connected to participant: ${participant.id}`);
        } catch (error) {
          console.error(`Failed to connect to participant ${participant.id}:`, error);
        }
      }
    }
  }

  /**
   * Handle new participant joining
   */
  async handleNewParticipant(participantId: string): Promise<void> {
    if (!this.currentUserId || participantId === this.currentUserId) return;

    if (!this.peers.has(participantId)) {
      try {
        await this.connectToParticipant(participantId);
        console.log(`Connected to new participant: ${participantId}`);
      } catch (error) {
        console.error(`Failed to connect to new participant ${participantId}:`, error);
      }
    }
  }

  /**
   * Handle participant leaving
   */
  handleParticipantLeft(participantId: string): void {
    if (this.peers.has(participantId)) {
      this.removePeer(participantId);
      console.log(`Removed participant: ${participantId}`);
    }
  }

  /**
   * Send data channel message
   */
  sendDataChannelMessage(participantId: string, message: any): void {
    const peerConnection = this.peers.get(participantId);
    if (peerConnection && peerConnection.peer.connectionState === 'connected') {
      // Implementation would depend on data channel setup
      console.log('Sending data channel message:', message);
    }
  }

  /**
   * Cleanup all connections
   */
  cleanup(): void {
    // Close all peer connections
    this.peers.forEach((peerConnection, participantId) => {
      this.removePeer(participantId);
    });

    // Unsubscribe from signaling
    this.signalingUnsubscribes.forEach(unsubscribe => unsubscribe());
    this.signalingUnsubscribes = [];

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = undefined;
    }

    // Reset state
    this.currentRoomId = undefined;
    this.currentUserId = undefined;
  }

  private setupPeerEventHandlers(peerConnection: PeerConnection, participantId: string): void {
    const { peer, audioElement } = peerConnection;

    // Handle incoming remote stream
    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;
      audioElement.srcObject = remoteStream;
      peerConnection.stream = remoteStream;
    };

    // Handle ICE candidates
    peer.onicecandidate = async (event) => {
      if (event.candidate && this.currentRoomId && this.currentUserId) {
        try {
          await signaling.sendIceCandidate(this.currentRoomId, this.currentUserId, participantId, event.candidate);
        } catch (error) {
          console.error('Failed to send ICE candidate:', error);
        }
      }
    };

    // Handle connection state changes
    peer.onconnectionstatechange = () => {
      this.callbacks.onConnectionStateChange?.(peer.connectionState);
      
      if (peer.connectionState === 'connected') {
        this.callbacks.onParticipantJoined?.(participantId);
      } else if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
        this.callbacks.onParticipantLeft?.(participantId);
      }
    };

    // Handle ICE connection state changes
    peer.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${participantId}:`, peer.iceConnectionState);
      
      if (peer.iceConnectionState === 'connected') {
        this.callbacks.onParticipantJoined?.(participantId);
      } else if (peer.iceConnectionState === 'disconnected' || peer.iceConnectionState === 'failed') {
        this.callbacks.onParticipantLeft?.(participantId);
      }
    };

    // Handle ICE candidate errors
    peer.onicecandidateerror = (error) => {
      console.error(`ICE candidate error for ${participantId}:`, error);
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
