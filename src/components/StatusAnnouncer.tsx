import React, { useEffect, useState, useCallback } from 'react';

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

  const announce = useCallback((msg: string) => setMessage(msg), []);
  const announceJoin = useCallback((name: string) => setMessage(`${name} joined the room`), []);
  const announceLeave = useCallback((name: string) => setMessage(`${name} left the room`), []);
  const announceMute = useCallback((isMuted: boolean) => setMessage(isMuted ? 'Microphone muted' : 'Microphone unmuted'), []);
  const announceConnect = useCallback((isConnected: boolean) => setMessage(isConnected ? 'Connected to audio bubble' : 'Disconnected from audio bubble'), []);
  const announcePTT = useCallback((isActive: boolean) => setMessage(isActive ? 'Push to talk active' : 'Push to talk released'), []);

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
