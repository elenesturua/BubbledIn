import { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { AboutPage } from './components/AboutPage';
import { CreateRoom } from './components/CreateRoom';
import { JoinRoom } from './components/JoinRoom';
import { AudioBubble } from './components/AudioBubble';
import { Toaster } from './components/ui/sonner';
import React from 'react';

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
    
    // Refresh the page to ensure microphone changes are applied
    // This ensures any lingering media streams are completely cleared
    console.log('Refreshing page to ensure microphone cleanup...');
    
    // Small delay to ensure cleanup operations complete before refresh
    setTimeout(() => {
      window.location.reload();
    }, 100);
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
      
      {/* Live region for announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="announcements" />
    </div>
  );
}