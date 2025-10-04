import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { AboutPage } from './components/AboutPage';
import { CreateRoom } from './components/CreateRoom';
import { JoinRoom } from './components/JoinRoom';
import { AudioBubble } from './components/AudioBubble';
import { Toaster } from './components/ui/sonner';

type AppState = 'home' | 'about' | 'create' | 'join' | 'bubble';

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [currentRoom, setCurrentRoom] = useState<any>(null);

  // Add skip link for keyboard navigation
  useEffect(() => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);

    return () => {
      const existingSkipLink = document.querySelector('.skip-link');
      if (existingSkipLink) {
        document.body.removeChild(existingSkipLink);
      }
    };
  }, []);

  const handleRoomCreated = (roomData: any) => {
    setCurrentRoom(roomData);
    setCurrentState('bubble');
  };

  const handleRoomJoined = (roomData: any) => {
    setCurrentRoom(roomData);
    setCurrentState('bubble');
  };

  const handleLeaveRoom = () => {
    setCurrentState('home');
    setCurrentRoom(null);
    
    // Refresh the page to ensure microphone changes are applied
    // This ensures any lingering media streams are completely cleared
    console.log('Refreshing page to ensure microphone cleanup...');
    
    // Small delay to ensure cleanup operations complete before refresh
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Update document title for screen readers
  useEffect(() => {
    const getTitle = () => {
      switch (currentState) {
        case 'home': return 'Audio Bubbles - Home';
        case 'about': return 'Audio Bubbles - About';
        case 'create': return 'Audio Bubbles - Create Room';
        case 'join': return 'Audio Bubbles - Join Room';
        case 'bubble': return `Audio Bubbles - ${currentRoom?.name || 'Room'}`;
        default: return 'Audio Bubbles';
      }
    };
    
    document.title = getTitle();
  }, [currentState, currentRoom?.name]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden heading for screen readers */}
      <h1 className="sr-only">
        {currentState === 'home' && 'Audio Bubbles - Home'}
        {currentState === 'about' && 'Audio Bubbles - About'}
        {currentState === 'create' && 'Audio Bubbles - Create Room'}
        {currentState === 'join' && 'Audio Bubbles - Join Room'}
        {currentState === 'bubble' && `Audio Bubbles - ${currentRoom?.name || 'Room'}`}
      </h1>
      
      <main id="main-content" className="min-h-screen">
        {currentState === 'home' && (
          <HomePage 
            onCreateRoom={() => setCurrentState('create')}
            onJoinRoom={() => setCurrentState('join')}
            onAbout={() => setCurrentState('about')}
          />
        )}

        {currentState === 'about' && (
          <AboutPage 
            onBack={() => {
              setCurrentState('home');
              setCurrentRoom(null);
            }}
          />
        )}

        {currentState === 'create' && (
          <CreateRoom 
            onBack={() => {
              setCurrentState('home');
              setCurrentRoom(null);
            }}
            onRoomCreated={handleRoomCreated}
          />
        )}

        {currentState === 'join' && (
          <JoinRoom 
            onBack={() => {
              setCurrentState('home');
              setCurrentRoom(null);
            }}
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
      
      {/* Live region for announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="announcements" />
    </div>
  );
}