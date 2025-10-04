import React, { useEffect, useState } from 'react';

interface StatusAnnouncerProps {
  message: string;
}

export function StatusAnnouncer({ message }: StatusAnnouncerProps) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      const timer = setTimeout(() => setAnnouncement(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  );
}

export function useStatusAnnouncer() {
  const [message, setMessage] = useState('');

  return {
    message,
    announce: setMessage,
    announceJoin: (name: string) => setMessage(`${name} joined the room`),
    announceLeave: (name: string) => setMessage(`${name} left the room`),
    announceMute: (isMuted: boolean) => setMessage(isMuted ? 'Microphone muted' : 'Microphone unmuted'),
    announceConnect: (isConnected: boolean) => setMessage(isConnected ? 'Connected to audio bubble' : 'Disconnected from audio bubble'),
    announcePTT: (isActive: boolean) => setMessage(isActive ? 'Push to talk active' : 'Push to talk released')
  };
}
