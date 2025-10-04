/**
 * WebRTC Debugger Component
 * Helps debug peer-to-peer connections and shows connection status
 */

import React, { useState, useEffect } from 'react';
import { peerManager } from '../webrtc/peer';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Wifi, WifiOff, Users, Mic, MicOff } from 'lucide-react';

interface ConnectionInfo {
  participantId: string;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  hasAudio: boolean;
}

export function WebRTCDebugger() {
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateConnections = () => {
      const peers = peerManager.getPeers();
      const connectionInfos: ConnectionInfo[] = [];

      peers.forEach((peerConnection, participantId) => {
        connectionInfos.push({
          participantId,
          connectionState: peerConnection.peer.connectionState,
          iceConnectionState: peerConnection.peer.iceConnectionState,
          hasAudio: !!peerConnection.stream
        });
      });

      setConnections(connectionInfos);
    };

    // Update connections every second
    const interval = setInterval(updateConnections, 1000);
    
    // Initial update
    updateConnections();

    return () => clearInterval(interval);
  }, []);

  const getConnectionStatusColor = (state: RTCPeerConnectionState) => {
    switch (state) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getIceStatusColor = (state: RTCIceConnectionState) => {
    switch (state) {
      case 'connected': return 'bg-green-500';
      case 'checking': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        <Wifi className="h-4 w-4 mr-2" />
        Debug WebRTC
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">WebRTC Debug</CardTitle>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-gray-600 mb-2">
            {connections.length} peer connection{connections.length !== 1 ? 's' : ''}
          </div>
          
          {connections.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-2">
              No peer connections
            </div>
          ) : (
            connections.map((conn) => (
              <div key={conn.participantId} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor(conn.connectionState)}`} />
                  <span className="font-mono text-xs">
                    {conn.participantId.substring(0, 8)}...
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1 py-0 ${getConnectionStatusColor(conn.connectionState)} text-white`}
                  >
                    {conn.connectionState}
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1 py-0 ${getIceStatusColor(conn.iceConnectionState)} text-white`}
                  >
                    {conn.iceConnectionState}
                  </Badge>
                  
                  {conn.hasAudio ? (
                    <Mic className="h-3 w-3 text-green-500" />
                  ) : (
                    <MicOff className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
