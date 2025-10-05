import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AudioControls } from './AudioControls';
import { ParticipantsList } from './ParticipantsList';
import { TranscriptionPanel } from './TranscriptionPanel';
import { StatusAnnouncer, useStatusAnnouncer } from './StatusAnnouncer';
import { QRCodeDisplay } from './QRCodeDisplay';
import { transcriptionService } from '../services/transcriptionService';
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
import { signaling, peerManager, type RoomData, type Participant } from '../webrtc';
import { authService } from '../firebase/auth';

interface AudioBubbleProps {
  roomData: RoomData;
  onLeave: () => void;
}

export function AudioBubble({ roomData, onLeave }: AudioBubbleProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(roomData.settings?.pushToTalk || false);
  const [isPushToTalkPressed, setIsPushToTalkPressed] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [activeTab, setActiveTab] = useState<'audio' | 'participants' | 'captions'>('audio');
  const [showQRCode, setShowQRCode] = useState(false);
  
  // Web Speech API state for transcription
  const [stream, setStream] = useState<MediaStream | null>(null);
  const userId = 'user-1';
  
  // WebRTC state for real participants
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  // Transcription state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranscriptionMuted, setIsTranscriptionMuted] = useState(false);
  
  // Refs to store unsubscribe functions
  const unsubscribeParticipantsRef = useRef<(() => void) | null>(null);
  const unsubscribeRoomRef = useRef<(() => void) | null>(null);
  const participantsRef = useRef<Participant[]>([]);
  
  // Status announcer for accessibility
  const { message, announce, announceJoin, announceLeave, announceMute, announceConnect } = useStatusAnnouncer();
  
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Update connection status based on participants and room state
  useEffect(() => {
    participantsRef.current = participants;
    // Always show connected if we have participants OR if we're in a room (even alone)
    if (participants.length > 0 || connectionStatus === 'connected') {
      console.log('🟢 Setting connection status to connected - participants:', participants.length);
      setConnectionStatus('connected');
      setIsConnected(true);
    }
  }, [participants.length, connectionStatus]);

  // Handle PTT state changes
  useEffect(() => {
    console.log('🎤 PTT Effect - PTT:', isPushToTalk, 'Pressed:', isPushToTalkPressed, 'Muted:', isMuted);
    if (isPushToTalk) {
      // PTT is enabled, control mic based on press state
      const shouldBeMuted = !isPushToTalkPressed;
      console.log('🎤 PTT enabled, setting mic muted to:', shouldBeMuted);
      peerManager.setMuted(shouldBeMuted);
      
      // Disable Live Captions completely when PTT is enabled
      setIsTranscriptionMuted(true);
    } else {
      // PTT is disabled, restore normal mute state
      console.log('🎤 PTT disabled, restoring mute state to:', isMuted);
      peerManager.setMuted(isMuted);
      
      // Also restore Live Captions mute state
      setIsTranscriptionMuted(isMuted);
    }
  }, [isPushToTalk, isPushToTalkPressed, isMuted]);

  // Handle PTT toggle on/off
  useEffect(() => {
    if (isPushToTalk) {
      // PTT just enabled, mute mic initially
      peerManager.setMuted(true);
      // Disable Live Captions completely when PTT is enabled
      setIsTranscriptionMuted(true);
    } else {
      // PTT disabled, restore normal mute state
      peerManager.setMuted(isMuted);
      // Also restore Live Captions mute state
      setIsTranscriptionMuted(isMuted);
    }
  }, [isPushToTalk, isMuted]);

  // Handle transcription mute state changes
  useEffect(() => {
    if (isTranscribing && isTranscriptionMuted) {
      // Stop transcription when muted
      console.log('🎤 Stopping transcription due to mute state');
      transcriptionService.stopTranscription();
      setIsTranscribing(false);
    } else if (!isTranscribing && !isTranscriptionMuted && stream && roomData?.settings?.transcription !== false) {
      // Start transcription when unmuted and not already transcribing
      console.log('🎤 Starting transcription due to unmute state');
      
      // Get the current user's name from participants list or fallback to displayName
      const currentUserId = authService.getCurrentUserId();
      const currentParticipant = participants.find(p => p.id === currentUserId);
      const userName = currentParticipant?.name || (roomData as any).displayName || 'You';
      
      transcriptionService.startTranscription(roomData.id, userName, stream)
        .then(() => {
          setIsTranscribing(true);
          console.log('✅ Transcription started successfully');
        })
        .catch((error) => {
          console.warn('⚠️ Failed to start transcription:', error);
        });
    }
  }, [isTranscriptionMuted, isTranscribing, stream, roomData, participants]);

  // Handle participant name changes - restart transcription with new name
  useEffect(() => {
    if (isTranscribing && stream && !isTranscriptionMuted && roomData?.settings?.transcription !== false) {
      const currentUserId = authService.getCurrentUserId();
      const currentParticipant = participants.find(p => p.id === currentUserId);
      const newUserName = currentParticipant?.name || (roomData as any).displayName || 'You';
      
      // Check if the name has changed and restart transcription
      if (currentParticipant?.name && currentParticipant.name !== 'You') {
        console.log('🎤 Participant name changed, restarting transcription with new name:', newUserName);
        transcriptionService.stopTranscription();
        transcriptionService.startTranscription(roomData.id, newUserName, stream)
          .then(() => {
            console.log('✅ Transcription restarted with new participant name');
          })
          .catch((error) => {
            console.warn('⚠️ Failed to restart transcription with new name:', error);
          });
      }
    }
  }, [participants, isTranscribing, stream, isTranscriptionMuted, roomData]);

  useEffect(() => {
    // Initialize WebRTC connection AND Web Speech API
    const initializeConnection = async () => {
      try {
        console.log('🚀 Initializing AudioBubble connection for room:', roomData.name, 'ID:', roomData.id);
        announce(`Joining audio bubble: ${roomData.name}. Connecting to audio...`);
        
        // STEP 0: Ensure user is authenticated
        console.log('🔐 Step 0: Ensuring user authentication...');
        console.log('🔐 Current auth state:', authService.isAuthenticated(), 'User ID:', authService.getCurrentUserId());
        
        if (!authService.isAuthenticated()) {
          console.log('🔐 User not authenticated, signing in anonymously...');
          try {
            await authService.signInAnonymously();
            // Wait a bit for auth state to propagate
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log('🔐 After sign in - Auth state:', authService.isAuthenticated(), 'User ID:', authService.getCurrentUserId());
          } catch (error) {
            console.error('❌ Authentication failed:', error);
            throw new Error('Failed to authenticate user');
          }
        }
        
        const userId = authService.getCurrentUserId();
        if (!userId) {
          console.error('❌ No user ID after authentication');
          throw new Error('User authentication failed - no user ID');
        }
        console.log('✅ User authenticated:', userId);
        
        // STEP 1: Initialize local media stream for WebRTC
        console.log('🎤 Step 1: Initializing local media stream...');
        await peerManager.initializeLocalStream();
        
        // STEP 2: Set up Web Speech API microphone access and start Live Captions
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
            
            // Start Live Captions only if transcription is enabled in room settings and not muted
            if (roomData.settings?.transcription !== false && !isTranscriptionMuted) {
              try {
                console.log('🎤 Starting Live Captions by Gemini...');
                
                // Get the current user's name from participants list or fallback to displayName
                const currentUserId = authService.getCurrentUserId();
                const currentParticipant = participants.find(p => p.id === currentUserId);
                const userName = currentParticipant?.name || (roomData as any).displayName || 'You';
                
                await transcriptionService.startTranscription(roomData.id, userName, mediaStream);
                setIsTranscribing(true);
                console.log('✅ Live Captions started successfully');
                announce('Live captions enabled');
              } catch (transcriptionError) {
                console.warn('⚠️ Failed to start Live Captions:', transcriptionError);
                // Don't throw error, just log it - the connection should still work
              }
            } else if (roomData.settings?.transcription === false) {
              console.log('🎤 Live Captions disabled for this room');
              announce('Live captions disabled for this room');
            } else {
              console.log('🎤 Live Captions muted initially');
            }
          } catch (error) {
            console.warn('⚠️ Web Speech API microphone access denied, continuing without transcription');
            announce('Microphone access denied for transcription features');
          }
        };

        setupTranscriptionMicrophone();
        
        // STEP 3: Initialize room for peer connections
        console.log('🏠 Step 3: Initializing room for peer connections...');
        await peerManager.initializeRoom(roomData.id);
        
        // Wait a moment for initialization to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mark as connected since we've successfully joined the room
        console.log('✅ Successfully joined room, updating connection status');
        setConnectionStatus('connected');
        setIsConnected(true);
        announceConnect(true);
        console.log('🟢 Connection status set to connected - user is now in the room');
        
        // Update participant display name if provided
        if ((roomData as any).displayName) {
          try {
            console.log('📝 Updating participant display name to:', (roomData as any).displayName);
            await signaling.updateParticipantName(roomData.id, userId, (roomData as any).displayName);
            console.log('✅ Participant display name updated successfully');
          } catch (error) {
            console.error('Failed to update participant display name:', error);
            // Don't throw error, just log it - the connection should still work
          }
        }
        
        // Set up peer manager callbacks
        console.log('📞 Step 4: Setting up peer manager callbacks...');
        peerManager.setCallbacks({
          onConnectionStateChange: (state) => {
            console.log('🔄 WebRTC connection state changed to:', state);
            if (state === 'connected') {
              console.log('✅ WebRTC peer connection established');
              // Don't override connection status here - it's managed by room participation
              announceConnect(true);
              vibrate([200, 100, 200]);
              toast.success('WebRTC peer connection established! Real-time audio available.');
            } else if (state === 'disconnected' || state === 'failed') {
              console.log('❌ WebRTC peer connection lost:', state);
              // Only update to disconnected if we're not connected to the room
              if (participantsRef.current.length === 0) {
                setConnectionStatus('disconnected');
                setIsConnected(false);
                announceConnect(false);
              }
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
          
          // Use functional update to get the current participants state
          setParticipants(prevParticipants => {
            // Handle participant changes
            const currentParticipantIds = prevParticipants.map(p => p.id);
            const newParticipantIds = updatedParticipants.map(p => p.id);
            
            // Find new participants
            const newParticipants = updatedParticipants.filter(p => 
              !currentParticipantIds.includes(p.id) && p.id !== authService.getCurrentUserId()
            );
            
            // Find participants who left
            const leftParticipants = prevParticipants.filter(p => 
              !newParticipantIds.includes(p.id) && p.id !== authService.getCurrentUserId()
            );
            
            // Connect to new participants
            for (const participant of newParticipants) {
              try {
                peerManager.handleNewParticipant(participant.id);
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
            
            // Connect to new participants only (with delay to prevent race conditions)
            for (let i = 0; i < newParticipants.length; i++) {
              const participant = newParticipants[i];
              try {
                console.log('🔗 Connecting to new participant:', participant.id);
                // Add a small delay between connections to prevent race conditions
                setTimeout(() => {
                  peerManager.handleNewParticipant(participant.id);
                }, i * 1000); // 1 second delay between each connection
              } catch (error) {
                console.error('Failed to connect to new participant:', participant.id, error);
              }
            }
            
            // Also ensure we're connected to all existing participants
            // This handles cases where connections might have failed
            if (updatedParticipants.length > 1) {
              try {
                console.log('🔗 Ensuring connections to all participants:', updatedParticipants.length);
                peerManager.connectToAllParticipants(updatedParticipants);
              } catch (error) {
                console.error('Failed to connect to all participants:', error);
              }
            }
            
            return updatedParticipants;
          });
        });

        // Subscribe to room updates
        unsubscribeRoomRef.current = signaling.onRoomUpdate(roomData.id, (room) => {
          console.log('📡 Room update callback received:', room);
          if (!room) {
            // Room was deleted
            console.log('❌ Room is null, treating as closed');
            announce('Room has been closed by the host');
            toast.info('Room has been closed');
            onLeave();
          } else {
            console.log('✅ Room update received successfully');
          }
        });

        // Cleanup on unmount
        return () => {
          console.log('🧹 Component unmounting, cleaning up...');
          
          // Unsubscribe from Firebase listeners
          if (unsubscribeParticipantsRef.current) {
            console.log('📡 Unsubscribing from participants listener (unmount)');
            unsubscribeParticipantsRef.current();
            unsubscribeParticipantsRef.current = null;
          }
          if (unsubscribeRoomRef.current) {
            console.log('📡 Unsubscribing from room listener (unmount)');
            unsubscribeRoomRef.current();
            unsubscribeRoomRef.current = null;
          }
          
          // Cleanup WebRTC connections (idempotent)
          console.log('🔌 Cleaning up WebRTC connections (unmount)');
          peerManager.cleanup();
          
          // Cleanup transcription microphone stream
          if (stream) {
            console.log('🎤 Stopping transcription microphone stream (unmount)');
            stream.getTracks().forEach(track => {
              console.log('🛑 Stopping track (unmount):', track.kind, track.label);
              track.stop();
              track.enabled = false;
            });
          }
          
          // Cleanup transcription service
          if (isTranscribing) {
            console.log('🎤 Stopping Live Captions (unmount)');
            transcriptionService.stopTranscription();
            setIsTranscribing(false);
          }
        };
      } catch (error) {
        announce('Failed to connect to audio bubble');
        toast.error('Failed to connect to audio bubble');
        setConnectionStatus('disconnected');
      }
    };

    initializeConnection();
  }, [roomData.id]); // Only depend on roomData.id, not the functions

  const toggleQRCode = () => {
    setShowQRCode(!showQRCode);
    announce(showQRCode ? 'QR code hidden' : 'QR code shown');
    vibrate(100);
  };

  const toggleMute = async () => {
    // Don't allow manual mute/unmute when PTT is active and pressed
    if (isPushToTalk && isPushToTalkPressed) {
      return;
    }
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Update Live Captions mute state to match microphone mute state
    setIsTranscriptionMuted(newMutedState);
    
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


  const handlePushToTalkPress = (pressed: boolean) => {
    console.log('🎤 PTT Press:', pressed, 'PTT Enabled:', isPushToTalk);
    setIsPushToTalkPressed(pressed);
    // When PTT is enabled, directly control microphone based on press state
    if (isPushToTalk) {
      const shouldBeMuted = !pressed;
      console.log('🎤 Setting mic muted to:', shouldBeMuted);
      peerManager.setMuted(shouldBeMuted);
    }
  };

  const toggleTranscription = () => {
    setShowTranscription(!showTranscription);
    announce(`Live captions ${showTranscription ? 'disabled' : 'enabled'}`);
    vibrate(50);
  };

  const leaveRoom = async () => {
    announce('Leaving audio bubble');
    vibrate([200, 100, 200, 100, 200]);
    
    try {
      console.log('🧹 Starting comprehensive cleanup...');
      
      // Unsubscribe from Firebase listeners FIRST to prevent new connections
      if (unsubscribeParticipantsRef.current) {
        console.log('📡 Unsubscribing from participants listener');
        unsubscribeParticipantsRef.current();
        unsubscribeParticipantsRef.current = null;
      }
      if (unsubscribeRoomRef.current) {
        console.log('📡 Unsubscribing from room listener');
        unsubscribeRoomRef.current();
        unsubscribeRoomRef.current = null;
      }
      
      // Cleanup WebRTC connections (stops all tracks and closes connections)
      console.log('🔌 Cleaning up WebRTC connections');
      peerManager.cleanup();
      
      // Cleanup transcription microphone stream
      if (stream) {
        console.log('🎤 Stopping transcription microphone stream');
        stream.getTracks().forEach(track => {
          console.log('🛑 Stopping track:', track.kind, track.label);
          track.stop();
          track.enabled = false;
        });
        setStream(null);
      }
      
      // Cleanup transcription service
      if (isTranscribing) {
        console.log('🎤 Stopping Live Captions');
        transcriptionService.stopTranscription();
        setIsTranscribing(false);
      }
      
      // Leave room in Firebase
      console.log('🚪 Leaving room in Firebase');
      await signaling.leaveRoom();
      
      console.log('✅ Cleanup completed successfully');
      toast.info('Left audio bubble');
      
      // Refresh the page to ensure all microphone permissions are released
      console.log('🔄 Refreshing page to release microphone permissions');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      toast.error('Error leaving room');
      
      // Ensure cleanup happens even if Firebase fails
      peerManager.cleanup();
      
      // Still refresh the page to release microphone
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } finally {
      // Don't call onLeave() since we're refreshing the page
      console.log('🔄 Page refresh initiated');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Status Announcer for accessibility */}
      <StatusAnnouncer message={message} />
      
      
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
                {isTranscribing && roomData.settings?.transcription !== false && (
                  <Badge className={`text-xs ${
                    isTranscriptionMuted 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`} aria-label={isTranscriptionMuted ? 'Live captions are muted' : 'Live captions are active'}>
                    <MessageSquare className="h-2.5 w-2.5 mr-1" aria-hidden="true" />
                    {isTranscriptionMuted ? 'Captions Muted' : 'Live Captions'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2" role="toolbar" aria-label="Room actions">
            <Button 
              onClick={toggleQRCode} 
              variant="ghost" 
              size="sm" 
              className="p-2 focus-ring touch-target"
              aria-label="Show QR code for room"
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

            {/* Audio Controls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <AudioControls
                isMuted={isMuted}
                volume={75}
                isPushToTalk={isPushToTalk}
                onMuteToggle={toggleMute}
                onVolumeChange={() => {}}
                onPushToTalkToggle={setIsPushToTalk}
                onPushToTalkPress={handlePushToTalkPress}
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

        {activeTab === 'captions' && roomData.settings?.transcription !== false && (
          <div 
            className="p-2 sm:p-4 h-full overflow-hidden"
            role="tabpanel"
            id="captions-panel"
            aria-labelledby="captions-tab"
          >
            <div className="bg-white rounded-2xl p-2 sm:p-4 shadow-sm border border-gray-100 h-full flex flex-col">
              <div className="mb-2 sm:mb-4 flex-shrink-0">
                <h2 className="font-semibold text-sm sm:text-base" id="captions-heading">Live Captions</h2>
              </div>
              <div className="flex-1 min-h-0" aria-labelledby="captions-heading">
                <TranscriptionPanel 
                  roomId={roomData.id}
                  roomName={roomData.name}
                  userId={authService.getCurrentUserId() || 'unknown'}
                  userName={(() => {
                    const currentUserId = authService.getCurrentUserId();
                    const currentParticipant = participants.find(p => p.id === currentUserId);
                    return currentParticipant?.name || (roomData as any).displayName || 'You';
                  })()}
                  stream={stream}
                  isTranscribing={isTranscribing}
                  isMuted={isTranscriptionMuted}
                  isPushToTalk={isPushToTalk}
                  isPushToTalkPressed={isPushToTalkPressed}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'captions' && roomData.settings?.transcription === false && (
          <div 
            className="p-4 h-full overflow-y-auto"
            role="tabpanel"
            id="captions-panel"
            aria-labelledby="captions-tab"
          >
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-700">Live Captions Disabled</h3>
                <p className="text-sm text-gray-500">Live captions were disabled when this room was created.</p>
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
            onClick={() => setActiveTab('audio')}
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
            onClick={() => setActiveTab('participants')}
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
          
          {roomData.settings?.transcription !== false && (
            <button
              onClick={() => setActiveTab('captions')}
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
          )}

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

      {/* QR Code Display */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative">
            <button
              onClick={() => setShowQRCode(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 focus-ring"
              aria-label="Close QR code"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Join Room</h3>
              <p className="text-sm text-gray-600">{roomData.name}</p>
            </div>
            <QRCodeDisplay 
              value={`${window.location.origin}?room=${roomData.id}`}
              size={250}
            />
          </div>
        </div>
      )}

    </div>
  );
}