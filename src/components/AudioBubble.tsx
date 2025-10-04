import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AudioControls } from './AudioControls';
import { ParticipantsList } from './ParticipantsList';
import { TranscriptionPanel } from './TranscriptionPanel';
import { StatusAnnouncer, useStatusAnnouncer } from './StatusAnnouncer';
import { WebRTCDebugger } from './WebRTCDebugger';
import { 
  Volume2, 
  VolumeX, 
  LogOut, 
  Users,
  Mic,
  Crown,
  Share2,
  MessageSquare,
  MicOff
} from 'lucide-react';
import { toast } from 'sonner';
import { signaling, peerManager, type RoomData, type Participant } from '../webrtc';
import { authService } from '../firebase/auth';

interface AudioBubbleProps {
  roomData: RoomData;
  onLeave: () => void;
}

export function AudioBubble({ roomData, onLeave }: AudioBubbleProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isPushToTalk, setIsPushToTalk] = useState(roomData.settings?.pushToTalk || false);
  const [isPresenterMode, setIsPresenterMode] = useState(roomData.settings?.presenterMode || false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [activeTab, setActiveTab] = useState<'audio' | 'participants' | 'captions'>('audio');
  
  // Web Speech API state for transcription
  const [stream, setStream] = useState<MediaStream | null>(null);
  const userId = 'user-1';
  
  // WebRTC state for real participants
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  // Refs to store unsubscribe functions
  const unsubscribeParticipantsRef = useRef<(() => void) | null>(null);
  const unsubscribeRoomRef = useRef<(() => void) | null>(null);
  
  // Status announcer for accessibility
  const { message, announce, announceJoin, announceLeave, announceMute, announceConnect } = useStatusAnnouncer();
  
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  useEffect(() => {
    // Initialize WebRTC connection AND Web Speech API
    const initializeConnection = async () => {
      try {
        console.log('🚀 Initializing AudioBubble connection for room:', roomData.name, 'ID:', roomData.id);
        announce(`Joining audio bubble: ${roomData.name}. Connecting to audio...`);
        
        // STEP 1: Initialize local media stream for WebRTC
        console.log('🎤 Step 1: Initializing local media stream...');
        await peerManager.initializeLocalStream();
        
        // STEP 2: Set up Web Speech API microphone access
        const setupTranscriptionMicrophone = async () => {
          try {
            console.log('🎤 Step 2: Setting up transcription microphone...');
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
              }
            });
            setStream(mediaStream);
            console.log('✅ Transcription microphone access granted');
            announce('Microphone access granted for Web Speech API transcription');
          } catch (error) {
            console.warn('⚠️ Web Speech API microphone access denied, continuing without transcription');
            announce('Microphone access denied for transcription features');
          }
        };

        setupTranscriptionMicrophone();
        
        // STEP 3: Initialize room for peer connections
        console.log('🏠 Step 3: Initializing room for peer connections...');
        await peerManager.initializeRoom(roomData.id);
        
        // Set up peer manager callbacks
        console.log('📞 Step 4: Setting up peer manager callbacks...');
        peerManager.setCallbacks({
          onConnectionStateChange: (state) => {
            console.log('🔄 WebRTC connection state changed to:', state);
            if (state === 'connected') {
              console.log('✅ Connected to audio bubble');
              setIsConnected(true);
              setConnectionStatus('connected');
              announceConnect(true);
              vibrate([200, 100, 200]);
              toast.success('Connected to audio bubble via WebRTC! Real-time transcription available.');
            } else if (state === 'disconnected') {
              console.log('❌ Disconnected from audio bubble');
              setIsConnected(false);
              setConnectionStatus('disconnected');
              announceConnect(false);
            }
          },
          onParticipantJoined: (participantId) => {
            console.log('👋 Participant joined:', participantId);
            announceJoin(`Participant ${participantId}`);
          },
          onParticipantLeft: (participantId) => {
            console.log('👋 Participant left:', participantId);
            announceLeave(`Participant ${participantId}`);
          },
          onError: (error) => {
            console.error('❌ WebRTC error:', error);
            toast.error('Connection error occurred');
          }
        });

        // Subscribe to participant updates
        console.log('📡 Step 5: Subscribing to participant updates...');
        unsubscribeParticipantsRef.current = signaling.onParticipants(roomData.id, async (updatedParticipants) => {
          console.log('👥 Participants updated:', updatedParticipants.length, 'participants');
          setParticipants(updatedParticipants);
          
          // Handle participant changes
          const currentParticipantIds = participants.map(p => p.id);
          const newParticipantIds = updatedParticipants.map(p => p.id);
          
          // Find new participants
          const newParticipants = updatedParticipants.filter(p => 
            !currentParticipantIds.includes(p.id) && p.id !== authService.getCurrentUserId()
          );
          
          // Find participants who left
          const leftParticipants = participants.filter(p => 
            !newParticipantIds.includes(p.id) && p.id !== authService.getCurrentUserId()
          );
          
          // Connect to new participants
          for (const participant of newParticipants) {
            try {
              await peerManager.handleNewParticipant(participant.id);
              announceJoin(participant.name);
            } catch (error) {
              // Connection failed, continue with other participants
            }
          }
          
          // Remove connections for participants who left
          for (const participant of leftParticipants) {
            peerManager.handleParticipantLeft(participant.id);
            announceLeave(participant.name);
          }
          
          // Connect to all existing participants if this is the first time
          if (participants.length === 0 && updatedParticipants.length > 1) {
            try {
              await peerManager.connectToAllParticipants(updatedParticipants);
            } catch (error) {
              // Connection failed, continue
            }
          }
        });

        // Subscribe to room updates
        unsubscribeRoomRef.current = signaling.onRoomUpdate(roomData.id, (room) => {
          if (!room) {
            // Room was deleted
            announce('Room has been closed by the host');
            toast.info('Room has been closed');
            onLeave();
          }
        });

        // Cleanup on unmount
        return () => {
          // Unsubscribe from Firebase listeners
          if (unsubscribeParticipantsRef.current) {
            unsubscribeParticipantsRef.current();
            unsubscribeParticipantsRef.current = null;
          }
          if (unsubscribeRoomRef.current) {
            unsubscribeRoomRef.current();
            unsubscribeRoomRef.current = null;
          }
          
          // Cleanup WebRTC connections (idempotent)
          peerManager.cleanup();
        };
      } catch (error) {
        announce('Failed to connect to audio bubble');
        toast.error('Failed to connect to audio bubble');
        setConnectionStatus('disconnected');
      }
    };

    initializeConnection();
  }, [roomData.name, roomData.id, announce, announceConnect, announceJoin, announceLeave, vibrate, onLeave]);

  const shareRoom = async () => {
    const shareData = {
      title: `Join ${roomData.name}`,
      text: `Join our audio bubble: ${roomData.name}`,
      url: `${window.location.origin}?room=${roomData.id}`
    };

    announce('Sharing room information');
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        announce('Room shared successfully');
      } catch (error) {
        navigator.clipboard.writeText(`Join ${roomData.name}\nCode: ${roomData.id}`);
        announce('Room information copied to clipboard');
        toast.success('Room info copied!');
      }
    } else {
      navigator.clipboard.writeText(`Join ${roomData.name}\nCode: ${roomData.id}`);
      announce('Room information copied to clipboard');
      toast.success('Room info copied!');
    }
    vibrate(100);
  };

  const toggleMute = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Update peer manager
    peerManager.setMuted(newMutedState);
    
    // Update signaling service
    const currentParticipant = participants.find(p => p.id === 'host' || p.isHost);
    if (currentParticipant) {
      try {
        await signaling.updateParticipantMute(currentParticipant.id, newMutedState);
      } catch (error) {
        // Mute status update failed, continue
      }
    }
    
    announceMute(newMutedState);
    vibrate(newMutedState ? [100, 50, 100] : 200);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    // Update volume for all participants
    participants.forEach(participant => {
      if (participant.id !== 'host' && !participant.isHost) {
        peerManager.setParticipantVolume(participant.id, newVolume);
      }
    });
  };

  const handleTabChange = (newTab: 'audio' | 'participants' | 'captions') => {
    setActiveTab(newTab);
    const tabNames = {
      audio: 'Audio Controls',
      participants: 'Participants List',
      captions: 'Live Captions'
    };
    announce(`Switched to ${tabNames[newTab]} tab`);
    vibrate(50);
  };

  const leaveRoom = async () => {
    announce('Leaving audio bubble');
    vibrate([200, 100, 200, 100, 200]);
    
    try {
      // Unsubscribe from Firebase listeners FIRST to prevent new connections
      if (unsubscribeParticipantsRef.current) {
        unsubscribeParticipantsRef.current();
        unsubscribeParticipantsRef.current = null;
      }
      if (unsubscribeRoomRef.current) {
        unsubscribeRoomRef.current();
        unsubscribeRoomRef.current = null;
      }
      
      // Cleanup WebRTC connections (stops all tracks and closes connections)
      peerManager.cleanup();
      
      // Leave room in Firebase
      await signaling.leaveRoom();
      
      toast.info('Left audio bubble');
    } catch (error) {
      toast.error('Error leaving room');
      
      // Ensure cleanup happens even if Firebase fails
      peerManager.cleanup();
    } finally {
      onLeave();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Status Announcer for accessibility */}
      <StatusAnnouncer message={message} />
      
      {/* WebRTC Debugger */}
      <WebRTCDebugger />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm" role="banner">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
              }`}
              role="img"
              aria-label={`Connection status: ${connectionStatus}`}
              />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">{roomData.name}</h1>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs text-gray-500 font-mono" aria-label={`Room code: ${roomData.id}`}>
                  {roomData.id}
                </span>
                {roomData.host && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs" aria-label="Vous êtes l'hôte">
                    <Crown className="h-2.5 w-2.5 mr-1" aria-hidden="true" />
                    Host
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2" role="toolbar" aria-label="Room actions">
            <Button 
              onClick={shareRoom} 
              variant="ghost" 
              size="sm" 
              className="p-2 focus-ring touch-target"
              aria-label="Share room information"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button 
              onClick={leaveRoom} 
              variant="ghost" 
              size="sm" 
              className="p-2 text-red-600 focus-ring touch-target"
              aria-label="Leave audio bubble"
                >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        
        {/* Live region for connection status announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {connectionStatus === 'connecting' && 'Connecting to audio bubble...'}
          {connectionStatus === 'connected' && 'Connected to audio bubble'}
          {connectionStatus === 'disconnected' && 'Disconnected from audio bubble'}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden" role="main">
        {activeTab === 'audio' && (
          <div 
            className="p-4 h-full overflow-y-auto space-y-6"
            role="tabpanel"
            id="audio-panel"
              aria-labelledby="audio-tab"
          >
            {/* Connection Status */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100" role="status" aria-live="polite">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-500' : 
                      connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                    }`}
                    role="img"
                    aria-label={`Connection status: ${connectionStatus}`}
                  />
                  <span className="font-medium text-sm">
                    {connectionStatus === 'connected' ? 'Connected' : 
                     connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                  </span>
                </div>
                <span className="text-xs text-gray-500" aria-label="Using WebRTC protocol">WebRTC</span>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <AudioControls
                isMuted={isMuted}
                volume={volume}
                isPushToTalk={isPushToTalk}
                isPresenterMode={isPresenterMode}
                onMuteToggle={toggleMute}
                onVolumeChange={handleVolumeChange}
                onPushToTalkToggle={setIsPushToTalk}
                onPresenterModeToggle={setIsPresenterMode}
              />
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div 
            className="p-4 h-full overflow-y-auto"
            role="tabpanel"
            id="participants-panel"
            aria-labelledby="participants-tab"
          >
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="mb-4">
                <h2 className="font-semibold" id="participants-heading">
                  Participants ({participants.length})
                </h2>
              </div>
              <div role="list" aria-labelledby="participants-heading">
                <ParticipantsList participants={participants} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'captions' && (
          <div 
            className="p-4 h-full overflow-y-auto"
            role="tabpanel"
            id="captions-panel"
            aria-labelledby="captions-tab"
          >
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 h-full">
              <div className="mb-4">
                <h2 className="font-semibold" id="captions-heading">Live Captions</h2>
              </div>
              <div aria-labelledby="captions-heading">
                <TranscriptionPanel stream={stream} userId={userId} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav 
        className="bg-white border-t border-gray-200 px-4 py-2 safe-area-pb" 
        role="tablist" 
        aria-label="Audio bubble navigation"
      >
        <div className="flex justify-around">
          <button
            onClick={() => handleTabChange('audio')}
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-colors focus-ring touch-target ${
              activeTab === 'audio' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
            role="tab"
            aria-selected={activeTab === 'audio'}
            aria-controls="audio-panel"
            id="audio-tab"
          >
            <Volume2 className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium">Audio</span>
          </button>
          
          <button
            onClick={() => handleTabChange('participants')}
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-colors relative focus-ring touch-target ${
              activeTab === 'participants' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
            role="tab"
            aria-selected={activeTab === 'participants'}
            aria-controls="participants-panel"
            id="participants-tab"
            aria-describedby="participant-count"
          >
            <Users className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium">People</span>
            <div 
              className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
              id="participant-count"
              aria-label={`${participants.length} participants`}
            >
              {participants.length}
            </div>
          </button>
          
          <button
            onClick={() => handleTabChange('captions')}
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-colors focus-ring touch-target ${
              activeTab === 'captions' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
            role="tab"
            aria-selected={activeTab === 'captions'}
            aria-controls="captions-panel"
            id="captions-tab"
          >
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium">Captions</span>
          </button>

          {/* Quick Mute Button */}
          <button
            onClick={toggleMute}
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-colors focus-ring touch-target ${
              isMuted ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'
            }`}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-pressed={isMuted}
          >
            {isMuted ? (
              <MicOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Mic className="h-5 w-5" aria-hidden="true" />
            )}
            <span className="text-xs font-medium">{isMuted ? 'Muted' : 'Live'}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}