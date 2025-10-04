import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AudioControls } from './AudioControls';
import { ParticipantsList } from './ParticipantsList';
import { TranscriptionPanel } from './TranscriptionPanel';
import { WebRTCDebugger } from './WebRTCDebugger';
import { 
  Volume2, 
  VolumeX, 
  Settings, 
  LogOut, 
  Users,
  Mic,
  Copy,
  Crown,
  Share2,
  MessageSquare,
  MicOff,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { signaling } from '../webrtc/signaling';
import { authService } from '../firebase/auth';
import { peerManager } from '../webrtc/peer';
import { pttManager } from '../webrtc/ptt';

interface AudioBubbleProps {
  roomData: any;
  onLeave: () => void;
}

export function AudioBubble({ roomData, onLeave }: AudioBubbleProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isPushToTalk, setIsPushToTalk] = useState(roomData.settings?.pushToTalk || false);
  const [isPresenterMode, setIsPresenterMode] = useState(roomData.settings?.presenterMode || false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [participants, setParticipants] = useState([]);

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  // Refs for cleanup
  const participantsUnsubscribeRef = useRef<(() => void) | null>(null);
  const roomUnsubscribeRef = useRef<(() => void) | null>(null);
  
  // Simple accessibility helpers
  const announce = (message: string) => {
    const announceEl = document.getElementById('announcements');
    if (announceEl) {
      announceEl.textContent = message;
    }
  };
  
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  useEffect(() => {
    let isCleanupCalled = false;

    const initializeWebRTC = async () => {
      try {
        console.log(' 🎤 Initializing WebRTC for room:', roomData.id);
        announce(`Joining audio bubble: ${roomData.name}. Connecting to audio...`);
        setConnectionStatus('connecting');

        // Initialize Firebase authentication first
        try {
          await authService.signInAnonymously();
          console.log('✅ Firebase authentication initialized');
        } catch (authError) {
          console.warn('⚠️ Firebase auth failed, continuing in guest mode:', authError);
          // Continue without auth - WebRTC can work without Firebase for basic functionality
        }

        // Initialize local media stream (this will request microphone permission)
        try {
          await peerManager.initializeLocalStream();
          console.log('✅ Local media stream initialized');
        } catch (mediaError) {
          console.error('❌ Failed to access microphone:', mediaError);
          announce('Microphone access denied. Audio features will be limited.');
          toast.error('Microphone access required for audio features');
          // Continue anyway but mute by default
          setIsMuted(true);
        }

        // Initialize room
        await peerManager.initializeRoom(roomData.id);
        console.log('✅ Room initialized');

        // Set up peer manager callbacks
        peerManager.setCallbacks({
          onConnectionStateChange: (state) => {
            console.log('🔗 Connection state changed:', state);
            if (state === 'connected') {
              setIsConnected(true);
              setConnectionStatus('connected');
              announce('Successfully connected to audio bubble. You can now communicate with other participants.');
              vibrate([200, 100, 200]);
              toast.success('Connected to audio bubble!');
            }
          },
          onParticipantJoined: (participantId) => {
            console.log('👥 Participant joined:', participantId);
            announce(`New participant joined the room`);
          },
          onParticipantLeft: (participantId) => {
            console.log('👥 Participant left:', participantId);
            announce(`Participant left the room`);
          },
          onError: (error) => {
            console.error('❌ Peer manager error:', error);
            toast.error('Connection error: ' + error.message);
          }
        });

        // Subscribe to participants updates
        participantsUnsubscribeRef.current = signaling.onParticipants(roomData.id, (participantsList) => {
          console.log('👥 Participants updated:', participantsList);
          setParticipants(participantsList);

          // Connect to new participants
          peerManager.connectToAllParticipants(participantsList);
        });

        // Subscribe to room updates
        roomUnsubscribeRef.current = signaling.onRoomUpdate(roomData.id, (room) => {
          if (room) {
            console.log('🏠 Room updated:', room);
          }
        });

        // Configure PTT if enabled
        if (isPushToTalk) {
          pttManager.configure({
            key: 'Space',
            enabled: true,
            onStart: () => {
              console.log('🎙️ PTT started');
              setIsMuted(false);
              peerManager.setMuted(false);
            },
            onEnd: () => {
              console.log('🎙️ PTT ended');
              setIsMuted(true);
              peerManager.setMuted(true);
            }
          });
        }

      } catch (error) {
        console.error('❌ Failed to initialize WebRTC:', error);
        announce('Failed to connect to audio bubble');
        setConnectionStatus('disconnected');
        toast.error('Failed to connect: ' + error.message);
      }
    };

    initializeWebRTC();

    // Cleanup function
    return () => {
      if (isCleanupCalled) return;
      isCleanupCalled = true;

      console.log('🧹 Cleaning up WebRTC connections...');

      // Cleanup subscriptions
      if (participantsUnsubscribeRef.current) {
        participantsUnsubscribeRef.current();
        participantsUnsubscribeRef.current = null;
      }

      if (roomUnsubscribeRef.current) {
        roomUnsubscribeRef.current();
        roomUnsubscribeRef.current = null;
      }

      // Cleanup peer manager
      peerManager.cleanup();

      // Cleanup signaling
      signaling.leaveRoom().catch(error => {
        console.error('❌ Error leaving room:', error);
      });

      // Cleanup PTT
      pttManager.cleanup();

      announce('Left audio bubble');
    };
  }, [roomData.id, roomData.name, isPushToTalk, announce, vibrate]);

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

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Update WebRTC mute state
    peerManager.setMuted(newMutedState);
    
    // Update Firebase participant mute status
    const currentUserId = authService.getCurrentUserId();
    if (currentUserId) {
      signaling.updateParticipantMute(currentUserId, newMutedState).catch(error => {
        console.error('❌ Failed to update mute status:', error);
      });
    }
    
    announce(newMutedState ? 'Microphone muted' : 'Microphone unmuted');
    vibrate(newMutedState ? [100, 50, 100] : 200);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    // Note: Volume control is handled per-participant in WebRTC peer manager
    // This global volume change affects UI only
  };

  const toggleTranscription = () => {
    setShowTranscription(!showTranscription);
    announce(`Live captions ${showTranscription ? 'disabled' : 'enabled'}`);
    vibrate(50);
  };

  const leaveRoom = () => {
    announce('Leaving audio bubble');
    vibrate([200, 100, 200, 100, 200]);
    toast.info('Left audio bubble');
    onLeave();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 flex flex-col">
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
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs" aria-label="You are the host">
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
        <div className="p-4 h-full overflow-y-auto space-y-6">
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

          {/* Participants List */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold" id="participants-heading">
                Participants ({participants.length})
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleTranscription}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    showTranscription 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  aria-label={showTranscription ? 'Hide live captions' : 'Show live captions'}
                >
                  {showTranscription ? 'Captions On' : 'Captions Off'}
                </button>
              </div>
            </div>
            <div role="list" aria-labelledby="participants-heading">
              <ParticipantsList participants={participants} />
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

          {/* Live Captions */}
          {showTranscription && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold mb-3" id="captions-heading">Live Caption</h3>
              <TranscriptionPanel />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Quick Actions */}
      <nav 
        className="bg-white border-t border-gray-200 px-4 py-2 safe-area-pb" 
        role="toolbar"
        aria-label="Quick actions"
      >
        <div className="flex justify-around">
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

          {/* Captions Toggle */}
          <button
            onClick={toggleTranscription}
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-colors focus-ring touch-target ${
              showTranscription ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
            aria-label={showTranscription ? 'Hide live captions' : 'Show live captions'}
            aria-pressed={showTranscription}
          >
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium">Captions</span>
          </button>

          {/* Share Room */}
          <button
            onClick={shareRoom}
            className="flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-colors focus-ring touch-target text-blue-600 hover:bg-blue-50"
            aria-label="Share room information"
          >
            <Share2 className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium">Share</span>
          </button>
        </div>
      </nav>

      {/* Development debugger */}
      {process.env.NODE_ENV === 'development' && <WebRTCDebugger />}
    </div>
  );
}