/**
 * StatusAnnouncer Component
 * Provides accessible announcements for screen readers
 */

import React, { useEffect, useState } from 'react';

interface StatusAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export function StatusAnnouncer({ 
  message, 
  priority = 'polite',
  className = 'sr-only'
}: StatusAnnouncerProps) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      // Clear message after announcement to allow re-announcing the same message
      const timer = setTimeout(() => setAnnouncement(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={className}
      role="status"
    >
      {announcement}
    </div>
  );
}

/**
 * Hook for managing status announcements
 */
export function useStatusAnnouncer() {
  const [message, setMessage] = useState('');

  const announce = (newMessage: string) => {
    setMessage(newMessage);
  };

  const announceJoin = (participantName: string) => {
    announce(`${participantName} joined the room`);
  };

  const announceLeave = (participantName: string) => {
    announce(`${participantName} left the room`);
  };

  const announceMute = (isMuted: boolean) => {
    announce(isMuted ? 'Microphone muted' : 'Microphone unmuted');
  };

  const announceConnect = (isConnected: boolean) => {
    announce(isConnected ? 'Connected to audio bubble' : 'Disconnected from audio bubble');
  };

  const announcePTT = (isActive: boolean) => {
    announce(isActive ? 'Push to talk active' : 'Push to talk released');
  };

  return {
    message,
    announce,
    announceJoin,
    announceLeave,
    announceMute,
    announceConnect,
    announcePTT
  };
}
