/**
 * WebRTC Configuration
 * Centralized configuration for WebRTC peer connections
 */

export const WEBRTC_CONFIG: RTCConfiguration = {
  iceServers: [
    // Primary STUN servers (Google - most reliable and widely available)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Secondary STUN servers (reliable alternatives)
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
    
    // Additional reliable STUN servers
    { urls: 'stun:stun.ekiga.net' },
    { urls: 'stun:stun.ideasip.com' },
    
    // TURN servers for relay when direct connection fails
    // Note: These are public TURN servers - for production, use your own
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

export const CONNECTION_CONFIG = {
  maxRetryAttempts: 3,
  retryDelay: 2000, // 2 seconds
  connectionTimeout: 30000, // 30 seconds
  iceGatheringTimeout: 10000 // 10 seconds
};

export const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1,
    // Enhanced voice isolation features (Google-specific)
    googEchoCancellation: true,        // Google's advanced echo cancellation
    googAutoGainControl: true,         // Google's auto gain control
    googNoiseSuppression: true,        // Google's noise suppression
    googHighpassFilter: true,          // High-pass filter for voice clarity
    googTypingNoiseDetection: true,    // Detect and reduce typing noise
    googAudioMirroring: false          // Disable audio mirroring for better isolation
  } as any
};

// Fallback configuration with only the most reliable servers
export const FALLBACK_WEBRTC_CONFIG: RTCConfiguration = {
  iceServers: [
    // Only Google STUN servers (most reliable)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // TURN servers for relay
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};
