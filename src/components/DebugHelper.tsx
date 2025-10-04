import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function DebugHelper() {
  const [showDebug, setShowDebug] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);

  // Load rooms from localStorage for debugging
  useEffect(() => {
    const updateRooms = () => {
      try {
        const stored = localStorage.getItem('mock-rooms');
        if (stored) {
          const roomsArray = JSON.parse(stored);
          setRooms(roomsArray.map(([id, room]: [string, any]) => ({ id, ...room })));
        }
      } catch (error) {
        console.error('Failed to load debug rooms:', error);
      }
    };

    updateRooms();
    const interval = setInterval(updateRooms, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const copyRoomUrl = (roomId: string) => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    toast.success('Room URL copied!');
  };

  const deleteRoom = (roomId: string) => {
    try {
      const stored = localStorage.getItem('mock-rooms');
      if (stored) {
        const roomsArray = JSON.parse(stored);
        const filteredRooms = roomsArray.filter(([id]: [string, any]) => id !== roomId);
        localStorage.setItem('mock-rooms', JSON.stringify(filteredRooms));
        setRooms(filteredRooms.map(([id, room]: [string, any]) => ({ id, ...room })));
        toast.success('Room deleted');
      }
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button 
        onClick={() => setShowDebug(!showDebug)}
        variant="outline"
        size="sm"
        className="bg-white shadow-lg"
      >
        {showDebug ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>

      {showDebug && (
        <Card className="w-80 max-h-96 overflow-y-auto mt-2 bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">🧪 Debug Rooms ({rooms.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rooms.length === 0 ? (
              <p className="text-xs text-gray-500">No rooms created yet</p>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{room.name}</p>
                      <p className="text-xs text-gray-500">ID: {room.id}</p>
                      <p className="text-xs text-gray-500">{room.participants?.length || 0} participants</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      onClick={() => copyRoomUrl(room.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy URL
                    </Button>
                    <Button
                      onClick={() => deleteRoom(room.id)}
                      variant="destructive"
                      size="sm"
                      className="text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
            
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                💡 Open URL in new tab to test joining
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
