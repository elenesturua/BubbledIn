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
      console.log('🎤 Initializing local media stream...');
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('✅ Local media stream initialized successfully');
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
    console.log('🏠 Initializing room:', roomId);
    this.currentRoomId = roomId;
    this.currentUserId = authService.getCurrentUserId() || undefined;
    
    if (!this.currentUserId) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log('👤 Current user ID:', this.currentUserId);
    // Set up signaling listeners for existing participants
    await this.setupSignalingListeners(roomId);
    console.log('📡 Signaling listeners set up for room:', roomId);
  }

  /**
   * Create a new peer connection
   */
  async createPeer(participantId: string): Promise<PeerConnection> {
    console.log('🔗 Creating peer connection for participant:', participantId);
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
      console.log('📤 Adding local stream tracks to peer connection');
      this.localStream.getTracks().forEach(track => {
        peer.addTrack(track, this.localStream!);
        console.log('📤 Added track:', track.kind, 'to peer:', participantId);
      });
    }

    this.peers.set(participantId, peerConnection);
    console.log('✅ Peer connection created for:', participantId);
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

    console.log('🤝 Connecting to participant:', participantId);
    // Create peer connection
    const peerConnection = await this.createPeer(participantId);
    
    // Create offer
    console.log('📤 Creating offer for participant:', participantId);
    const offer = await peerConnection.peer.createOffer();
    await peerConnection.peer.setLocalDescription(offer);
    console.log('📤 Offer created and set as local description');
    
    // Send offer through signaling
    console.log('📡 Sending offer to participant:', participantId);
    await signaling.sendSignaling(this.currentRoomId, participantId, { offer });
    console.log('✅ Offer sent successfully to:', participantId);
  }

  /**
   * Handle incoming offer
   */
  async handleOffer(fromId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.currentRoomId || !this.currentUserId) {
      console.error('❌ Room not initialized');
      throw new Error('Room not initialized');
    }

    console.log('📥 Received offer from participant:', fromId);
    // Create peer connection
    const peerConnection = await this.createPeer(fromId);
    
    // Set remote description
    console.log('📥 Setting remote description for participant:', fromId);
    await peerConnection.peer.setRemoteDescription(offer);
    
    // Create answer
    console.log('📤 Creating answer for participant:', fromId);
    const answer = await peerConnection.peer.createAnswer();
    await peerConnection.peer.setLocalDescription(answer);
    console.log('📤 Answer created and set as local description');
    
    // Send answer through signaling
    console.log('📡 Sending answer to participant:', fromId);
    await signaling.sendSignaling(this.currentRoomId, fromId, { answer });
    console.log('✅ Answer sent successfully to:', fromId);
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(fromId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    console.log('📥 Received answer from participant:', fromId);
    const peerConnection = this.peers.get(fromId);
    if (peerConnection) {
      console.log('📥 Setting remote description (answer) for participant:', fromId);
      await peerConnection.peer.setRemoteDescription(answer);
      console.log('✅ Answer processed for participant:', fromId);
    } else {
      console.warn('⚠️ No peer connection found for participant:', fromId);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(fromId: string, candidate: RTCIceCandidateInit): Promise<void> {
    console.log('🧊 Received ICE candidate from participant:', fromId);
    const peerConnection = this.peers.get(fromId);
    if (peerConnection) {
      console.log('🧊 Adding ICE candidate for participant:', fromId);
      await peerConnection.peer.addIceCandidate(candidate);
      console.log('✅ ICE candidate added for participant:', fromId);
    } else {
      console.warn('⚠️ No peer connection found for ICE candidate from participant:', fromId);
    }
  }

  /**
   * Add remote stream to peer connection
   */
  addRemoteStream(participantId: string, stream: MediaStream): void {
    console.log('🎵 Adding remote stream for participant:', participantId);
    const peerConnection = this.peers.get(participantId);
    if (!peerConnection) {
      console.warn('⚠️ No peer connection found for participant:', participantId);
      return;
    }

    // Add remote stream to audio element
    peerConnection.audioElement.srcObject = stream;
    peerConnection.stream = stream;
    console.log('✅ Remote stream added for participant:', participantId);
  }

  removePeer(participantId: string): void {
    console.log('🗑️ Removing peer connection for participant:', participantId);
    const peerConnection = this.peers.get(participantId);
    if (!peerConnection) {
      console.log('ℹ️ No peer connection found for participant:', participantId);
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
        if (sender.track) {
          sender.track.stop();
        }
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
      console.log('✅ Peer connection removed for participant:', participantId);
    } catch (error) {
      console.error('❌ Error removing peer connection for participant:', participantId, error);
      // Still remove from peers map even if cleanup failed
      this.peers.delete(participantId);
    }
  }

  /**
   * Mute/unmute local stream
   */
  setMuted(muted: boolean): void {
    console.log('🔇 Setting local stream muted:', muted);
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
        console.log('🔇 Track enabled:', !muted, 'for track:', track.kind);
      });
    } else {
      console.warn('⚠️ No local stream available for muting');
    }
  }

  /**
   * Set volume for a specific participant
   */
  setParticipantVolume(participantId: string, volume: number): void {
    console.log('🔊 Setting volume for participant:', participantId, 'to', volume + '%');
    const peerConnection = this.peers.get(participantId);
    if (peerConnection) {
      peerConnection.audioElement.volume = volume / 100;
      console.log('✅ Volume set for participant:', participantId);
    } else {
      console.warn('⚠️ No peer connection found for volume adjustment:', participantId);
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

    for (const participant of participants) {
      if (participant.id !== this.currentUserId && !this.peers.has(participant.id)) {
        try {
          await this.connectToParticipant(participant.id);
        } catch (error) {
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

    if (!this.peers.has(participantId)) {
      try {
        await this.connectToParticipant(participantId);
      } catch (error) {
        // Connection failed, continue
      }
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

  sendDataChannelMessage(participantId: string, message: any): void {
    const peerConnection = this.peers.get(participantId);
    if (peerConnection && peerConnection.peer.connectionState === 'connected') {
      // Implementation would depend on data channel setup
    }
  }

  cleanup(): void {
    console.log('🧹 Starting peer manager cleanup...');
    if (this.peers.size === 0 && !this.localStream && this.signalingUnsubscribes.length === 0) {
      console.log('ℹ️ Already cleaned up, skipping');
      return;
    }
    
    console.log('📊 Current state - Peers:', this.peers.size, 'Local stream:', !!this.localStream, 'Signaling subs:', this.signalingUnsubscribes.length);
    
    this.stopAllRemoteStreams();
    
    const participantIds = Array.from(this.peers.keys());
    console.log('🗑️ Removing', participantIds.length, 'peer connections');
    participantIds.forEach(participantId => {
      this.removePeer(participantId);
    });

    if (this.localStream) {
      console.log('🛑 Stopping local stream tracks');
      this.localStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      this.localStream = undefined;
    }

    console.log('📡 Unsubscribing from signaling');
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
    console.log('✅ Peer manager cleanup completed');
  }

  private setupPeerEventHandlers(peerConnection: PeerConnection, participantId: string): void {
    const { peer, audioElement } = peerConnection;

    // Handle incoming remote stream
    peer.ontrack = (event) => {
      console.log('🎵 Received remote track from participant:', participantId);
      const [remoteStream] = event.streams;
      audioElement.srcObject = remoteStream;
      peerConnection.stream = remoteStream;
      console.log('✅ Remote stream connected for participant:', participantId);
    };

    // Handle ICE candidates
    peer.onicecandidate = async (event) => {
      if (event.candidate && this.currentRoomId && this.currentUserId) {
        console.log('🧊 Generated ICE candidate for participant:', participantId);
        try {
          await signaling.sendSignaling(this.currentRoomId, participantId, { iceCandidates: [event.candidate] });
          console.log('📡 ICE candidate sent to participant:', participantId);
        } catch (error) {
          console.error('❌ Failed to send ICE candidate to participant:', participantId, error);
        }
      }
    };

    // Handle connection state changes
    peer.onconnectionstatechange = () => {
      console.log('🔄 Connection state changed for participant:', participantId, 'to:', peer.connectionState);
      this.callbacks.onConnectionStateChange?.(peer.connectionState);
      
      if (peer.connectionState === 'connected') {
        console.log('✅ Connected to participant:', participantId);
        this.callbacks.onParticipantJoined?.(participantId);
      } else if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
        console.log('❌ Disconnected from participant:', participantId, 'state:', peer.connectionState);
        this.callbacks.onParticipantLeft?.(participantId);
      }
    };

    // Handle ICE connection state changes
    peer.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state changed for participant:', participantId, 'to:', peer.iceConnectionState);
      if (peer.iceConnectionState === 'connected') {
        console.log('✅ ICE connected to participant:', participantId);
        this.callbacks.onParticipantJoined?.(participantId);
      } else if (peer.iceConnectionState === 'disconnected' || peer.iceConnectionState === 'failed') {
        console.log('❌ ICE disconnected from participant:', participantId, 'state:', peer.iceConnectionState);
        this.callbacks.onParticipantLeft?.(participantId);
      }
    };

    // Handle ICE candidate errors
    peer.onicecandidateerror = (error) => {
      console.error('❌ ICE candidate error for participant:', participantId, error);
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
