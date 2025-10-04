import React from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Mic, MicOff, Crown, Volume2 } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isPresenter: boolean;
}

interface ParticipantsListProps {
  participants: Participant[];
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-teal-500'
    ];
    return colors[parseInt(id) % colors.length];
  };

  const getParticipantStatus = (participant: Participant) => {
    const statuses = [];
    if (participant.id === '1') statuses.push('You');
    if (participant.isHost) statuses.push('Host');
    if (participant.isPresenter) statuses.push('Presenter');
    if (participant.isMuted) statuses.push('Muted');
    else statuses.push('Unmuted');
    
    return statuses.join(', ');
  };
  return (
    <div className="space-y-3">
      {participants.map((participant) => (
        <div 
          key={participant.id} 
          className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
          role="listitem"
          aria-label={`${participant.name} - ${getParticipantStatus(participant)}`}
        >
          <div className="flex items-center space-x-3 flex-1">
            <Avatar className="h-12 w-12" role="img" aria-label={`${participant.name}'s avatar`}>
              <AvatarFallback className={`text-white ${getAvatarColor(participant.id)}`}>
                {getInitials(participant.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-base truncate" aria-hidden="true">
                  {participant.name}
                </span>
                {participant.isHost && (
                  <Crown 
                    className="h-4 w-4 text-yellow-600 shrink-0" 
                    aria-label="Host"
                    role="img"
                  />
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {participant.isPresenter && (
                  <Badge variant="secondary" className="text-xs" aria-label="Presenter mode active">
                    <Volume2 className="h-3 w-3 mr-1" aria-hidden="true" />
                    Presenter
                  </Badge>
                )}
                {participant.id === '1' && (
                  <Badge variant="outline" className="text-xs" aria-label="This is you">
                    You
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3" role="group" aria-label="Audio status">
            {/* Speaking indicator */}
            {!participant.isMuted && (
              <div 
                className="flex space-x-1" 
                role="img" 
                aria-label="Speaking indicator"
                aria-hidden="true"
              >
                <div className="w-1 h-5 bg-green-400 rounded-full animate-pulse" />
                <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
            
            {/* Mic status */}
            <div 
              className={`p-2 rounded-full ${
                participant.isMuted ? 'bg-red-100' : 'bg-green-100'
              }`}
              role="img"
              aria-label={participant.isMuted ? 'Microphone muted' : 'Microphone active'}
            >
              {participant.isMuted ? (
                <MicOff className="h-4 w-4 text-red-600" aria-hidden="true" />
              ) : (
                <Mic className="h-4 w-4 text-green-600" aria-hidden="true" />
              )}
            </div>
          </div>
          
          {/* Screen reader only status summary */}
          <div className="sr-only">
            {participant.name} is {participant.isMuted ? 'muted' : 'unmuted'}
            {participant.isHost && ', is the host'}
            {participant.isPresenter && ', is in presenter mode'}
            {participant.id === '1' && ', this is you'}
          </div>
        </div>
      ))}

      {participants.length === 1 && (
        <div className="text-center py-8 text-gray-500" role="status" aria-live="polite">
          <div className="space-y-2">
            <p>Waiting for others to join...</p>
            <p className="text-sm">Share the QR code or room ID</p>
          </div>
        </div>
      )}
      
      {/* Live region for participant updates */}
      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {participants.length} participant{participants.length !== 1 ? 's' : ''} in the room
      </div>
    </div>
  );
}