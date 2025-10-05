import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { AboutPage } from './components/AboutPage';
import { CreateRoom } from './components/CreateRoom';
import { JoinRoom } from './components/JoinRoom';
import { AudioBubble } from './components/AudioBubble';
import { DisplayNameModal } from './components/DisplayNameModal';
import { Toaster } from './components/ui/sonner';
import { signaling } from './webrtc/signaling';
import { DebugHelper } from './components/DebugHelper';
import { toast } from 'sonner';

type AppState = 'home' | 'about' | 'create' | 'join' | 'display-name' | 'bubble';

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [pendingRoomData, setPendingRoomData] = useState<any>(null);

  // Handle URL parameters for direct room joining
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    
    if (roomParam) {
      // Try to join the room directly from URL
      signaling.joinRoom(roomParam, 'Participant')
        .then(roomData => {
          const roomDataForUI = {
            id: roomData.id,
            name: roomData.name,
            host: false,
            settings: roomData.settings,
            url: roomData.url
          };
          
          // Navigate to display name page for URL-based joins
          setPendingRoomData(roomDataForUI);
          setCurrentState('display-name');
          toast.success(`Room "${roomData.name}" found! Please enter your display name.`);
        })
        .catch(error => {
          console.error('Failed to join room from URL:', error);
          // Room not found, redirect to join page with the room code
          setCurrentState('join');
        });
    }
  }, []);


  const handleAbout = () => {
    setCurrentState('about');
  };

  const handleCreateRoom = () => {
    setCurrentState('create');
  };

  const handleJoinRoom = () => {
    setCurrentState('join');
  };

  const handleRoomCreated = (roomData: any) => {
    setCurrentRoom(roomData);
    setCurrentState('bubble');
  };

  const handleRoomJoined = (roomData: any) => {
    setPendingRoomData(roomData);
    setCurrentState('display-name');
  };

  const handleBackToHome = () => {
    setCurrentState('home');
    setCurrentRoom(null);
  };

  const handleLeaveRoom = () => {
    setCurrentState('home');
    setCurrentRoom(null);
  };

  const handleDisplayNameConfirm = async (displayName: string) => {
    if (pendingRoomData) {
      // Store the display name in the room data for later use
      const roomDataWithDisplayName = {
        ...pendingRoomData,
        displayName: displayName
      };
      
      setCurrentRoom(roomDataWithDisplayName);
      setCurrentState('bubble');
      toast.success(`Joined "${pendingRoomData.name}" as ${displayName}!`);
    }
    
    setPendingRoomData(null);
  };

  const handleDisplayNameCancel = () => {
    setPendingRoomData(null);
    setCurrentState('home');
  };

  // Get page title for screen readers
  const getPageInfo = () => {
    switch (currentState) {
      case 'home':
        return { title: 'BubbledIn - Home' };
      case 'about':
        return { title: 'BubbledIn - About' };
      case 'create':
        return { title: 'BubbledIn - Create Room' };
      case 'join':
        return { title: 'BubbledIn - Join Room' };
      case 'display-name':
        return { title: 'BubbledIn - Enter Display Name' };
      case 'bubble':
        return { title: `BubbledIn - ${currentRoom?.name || 'Room'}` };
      default:
        return { title: 'BubbledIn' };
    }
  };

  const pageInfo = getPageInfo();

  // Update document title for screen readers
  useEffect(() => {
    document.title = pageInfo.title;
  }, [pageInfo.title]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden heading for screen readers */}
      <h1 className="sr-only">{pageInfo.title}</h1>
      
      <main id="main-content" className="min-h-screen">
        {currentState === 'home' && (
          <HomePage 
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onAbout={handleAbout}
          />
        )}

        {currentState === 'about' && (
          <AboutPage 
            onBack={handleBackToHome}
          />
        )}

        {currentState === 'create' && (
          <CreateRoom 
            onBack={handleBackToHome}
            onRoomCreated={handleRoomCreated}
          />
        )}

        {currentState === 'join' && (
          <JoinRoom 
            onBack={handleBackToHome}
            onRoomJoined={handleRoomJoined}
          />
        )}

        {currentState === 'display-name' && pendingRoomData && (
          <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <DisplayNameModal
                isOpen={true}
                onConfirm={handleDisplayNameConfirm}
                onCancel={handleDisplayNameCancel}
              />
            </div>
          </div>
        )}

        {currentState === 'bubble' && currentRoom && (
          <AudioBubble 
            roomData={currentRoom}
            onLeave={handleLeaveRoom}
          />
        )}
      </main>

      <Toaster />
      
      {/* Debug helper for development */}
      <DebugHelper />
      
      {/* Live region for announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="announcements" />
    </div>
  );
}