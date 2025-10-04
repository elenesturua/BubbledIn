import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AudioControls } from './AudioControls';
import { ParticipantsList } from './ParticipantsList';
import { TranscriptionPanel } from './TranscriptionPanel';
import { testWebSpeechAPI, quickSpeechTest } from '../hooks/useTranscription';
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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeTab, setActiveTab] = useState<'participants' | 'captions'>('captions');
  const userId = 'user-1'; // or generate a unique ID
  const [participants, setParticipants] = useState([
    { id: '1', name: 'You', isHost: roomData.host, isMuted: false, isPresenter: roomData.host },
    { id: '2', name: 'Alex Chen', isHost: false, isMuted: false, isPresenter: false },
    { id: '3', name: 'Sarah Kim', isHost: false, isMuted: true, isPresenter: false },
  ]);

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
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
    // Announce room entry
    announce(`Joining audio bubble: ${roomData.name}. Connecting to audio...`);
    
    // Get microphone access for transcription
    const setupMicrophone = async () => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setStream(userStream);
        console.log('🎤 Microphone access granted for transcription');
      } catch (error) {
        console.warn('⚠️ Could not access microphone:', error);
        toast.warning('Microphone access needed for live captions');
      }
    };

    // Simulate connection process
    const timer = setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus('connected');
      announce('Successfully connected to audio bubble. You can now communicate with other participants.');
      vibrate([200, 100, 200]);
      toast.success('Connected to audio bubble!');
      
      // Setup microphone after connection
      setupMicrophone();
    }, 2000);

    return () => {
      clearTimeout(timer);
      // Cleanup stream on unmount
      if (stream) {
        stream.getTracks().forEach(task => task.stop());
      }
    };
  }, [roomData.name, announce, vibrate]);

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
    setParticipants(prev => 
      prev.map(p => p.id === '1' ? { ...p, isMuted: newMutedState } : p)
    );
    announce(newMutedState ? 'Microphone muted' : 'Microphone unmuted');
    vibrate(newMutedState ? [100, 50, 100] : 200);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
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

  const testSpeechAPI = async () => {
    console.log('🧪 Testing Web Speech API...');
    
    // Test API availability
    const apiTest = testWebSpeechAPI();
    console.log('📱 API Test:', apiTest);
    
    if (!apiTest.supported) {
      toast.error(`❌ Speech API Issue: ${apiTest.error}`);
      return;
    }

    // Test microphone and speech recognition
    const fullTest = await quickSpeechTest();
    console.log('🎤 Full Test:', fullTest);
    
    if (fullTest.mic && fullTest.speech) {
      toast.success('✅ Web Speech API is working perfectly!');
      announce('Web Speech API test successful');
    } else {
      toast.error(`❌ Test Failed: ${fullTest.error}`);
      announce(`Web Speech API test failed: ${fullTest.error}`);
    }
    
    vibrate(100);
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
              onClick={testSpeechAPI} 
              variant="ghost" 
              size="sm" 
              className="p-2 focus-ring touch-target"
              aria-label="Test speech API"
              title="Test Web Speech API"
            >
              🧪
            </Button>
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

          {/* Tab Navigation */}
          {showTranscription && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-96">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-4">
                  <button
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'participants' 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('participants')}
                    id="participants-tab"
                    role="tab"
                    aria-selected={activeTab === 'participants'}
                    aria-controls="participants-panel"
                  >
                    Participants
                  </button>
                  <button
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'captions' 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('captions')}
                    id="captions-tab"
                    role="tab"
                    aria-selected={activeTab === 'captions'}
                    aria-controls="captions-panel"
                  >
                    Live Captions
                  </button>
                </nav>
              </div>
              
              {/* Tab Panels */}
              {activeTab === 'participants' && (
                <div 
                  className="p-4 h-full overflow-y-auto"
                  role="tabpanel"
                  id="participants-panel"
                  aria-labelledby="participants-tab"
                >
                  <div className="space-y-3">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {participant.name.charAt(0)}
                          </div>
                          <span className="font-medium">{participant.name}</span>
                          {participant.isHost && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              <Crown className="h-2.5 w-2.5 mr-1" />
                              Host
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {participant.isMuted && (
                            <MicOff className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-xs text-gray-500">
                            {participant.isMuted ? 'Muted' : 'Live'}
                          </span>
                        </div>
                      </div>
                    ))}
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
                  <TranscriptionPanel stream={stream} userId={userId} />
                </div>
              )}
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
    </div>
  );
}