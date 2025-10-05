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

type AppState = 'home' | 'about' | 'create' | 'join' | 'bubble';

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
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
          
          // Show display name modal for URL-based joins
          setPendingRoomData(roomDataForUI);
          setShowDisplayNameModal(true);
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
    setCurrentRoom(roomData);
    setCurrentState('bubble');
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
      // Update the participant's display name in Firebase
      try {
        const userId = signaling.getCurrentUserId();
        if (userId) {
          await signaling.updateParticipantName(pendingRoomData.id, userId, displayName);
        }
        
        setCurrentRoom(pendingRoomData);
        setCurrentState('bubble');
        toast.success(`Joined "${pendingRoomData.name}" as ${displayName}!`);
      } catch (error) {
        console.error('Failed to update display name:', error);
        // Still proceed with joining even if name update fails
        setCurrentRoom(pendingRoomData);
        setCurrentState('bubble');
        toast.success(`Joined "${pendingRoomData.name}" successfully!`);
      }
    }
    
    setShowDisplayNameModal(false);
    setPendingRoomData(null);
  };

  const handleDisplayNameCancel = () => {
    setShowDisplayNameModal(false);
    setPendingRoomData(null);
    setCurrentState('home');
  };

  // Get page title for screen readers
  const getPageInfo = () => {
    switch (currentState) {
      case 'home':
        return { title: 'Audio Bubbles - Home' };
      case 'about':
        return { title: 'Audio Bubbles - About' };
      case 'create':
        return { title: 'Audio Bubbles - Create Room' };
      case 'join':
        return { title: 'Audio Bubbles - Join Room' };
      case 'bubble':
        return { title: `Audio Bubbles - ${currentRoom?.name || 'Room'}` };
      default:
        return { title: 'Audio Bubbles' };
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

      {/* Display Name Modal */}
      <DisplayNameModal
        isOpen={showDisplayNameModal}
        onConfirm={handleDisplayNameConfirm}
        onCancel={handleDisplayNameCancel}
      />
    </div>
  );
}