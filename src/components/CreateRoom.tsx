import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { QRCodeDisplay } from './QRCodeDisplay';
import { ArrowLeft, Copy, Users, Settings, Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { signaling } from '../webrtc/signaling';

interface CreateRoomProps {
  onBack: () => void;
  onRoomCreated: (roomData: any) => void;
}

export function CreateRoom({ onBack, onRoomCreated }: CreateRoomProps) {
  const [roomName, setRoomName] = useState('');
  const [pushToTalk, setPushToTalk] = useState(false);
  const [transcription, setTranscription] = useState(true);
  const [roomCreated, setRoomCreated] = useState(false);
  const [roomData, setRoomData] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async () => {
    if (!roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    setIsCreating(true);
    try {
      const newRoomData = await signaling.createRoom(roomName, {
        pushToTalk,
        transcription
      });
      
      setRoomData(newRoomData);
      setRoomCreated(true);
      toast.success('Room created! Share the QR code to invite others.');
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyRoomLink = () => {
    if (roomData) {
      navigator.clipboard.writeText(roomData.url);
      toast.success('Room link copied!');
    }
  };

  const shareRoom = async () => {
    if (roomData && navigator.share) {
      try {
        await navigator.share({
          title: `Join ${roomData.name}`,
          text: `Join our audio bubble: ${roomData.name}`,
          url: roomData.url
        });
      } catch (error) {
        copyRoomLink();
      }
    } else {
      copyRoomLink();
    }
  };

  if (roomCreated && roomData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50">
        <div className="px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pt-4">
            <Button onClick={onBack} variant="ghost" size="sm" className="p-2 hover:bg-blue-50">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <h1 className="text-xl font-semibold">Bubble Created!</h1>
            <div className="w-9" />
          </div>

          {/* Success Icon */}
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <p className="text-gray-600">Share this QR code for others to join</p>
          </div>

          {/* Room Info */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{roomData.name}</h2>
              <p className="text-lg font-mono text-gray-600 bg-gray-50 px-3 py-1 rounded-xl inline-block">
                {roomData.id}
              </p>
            </div>

            <QRCodeDisplay value={roomData.url} size={240} />
          </div>

          {/* Share Actions */}
          <div className="space-y-3">
            <Button 
              onClick={shareRoom} 
              className="w-full h-12 rounded-2xl"
              size="lg"
            >
              <Share2 className="h-5 w-5 mr-3" />
              Share Room
            </Button>
            
            <Button 
              onClick={copyRoomLink} 
              variant="outline" 
              className="w-full h-12 rounded-2xl border-2"
              size="lg"
            >
              <Copy className="h-5 w-5 mr-3" />
              Copy Link
            </Button>
          </div>

          {/* Settings Summary */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold mb-4">Room Settings</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Push to Talk</span>
                <span className={`text-sm font-medium ${pushToTalk ? 'text-green-600' : 'text-gray-400'}`}>
                  {pushToTalk ? 'On' : 'Off'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Live Captions</span>
                <span className={`text-sm font-medium ${transcription ? 'text-green-600' : 'text-gray-400'}`}>
                  {transcription ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => onRoomCreated(roomData)} 
              className="w-full h-14 text-lg rounded-2xl shadow-md"
              size="lg"
            >
              Enter Audio Bubble
            </Button>
            
            <Button 
              onClick={onBack}
              variant="ghost" 
              className="w-full h-12 rounded-2xl text-gray-600 hover:text-gray-800"
              size="lg"
            >
              Create Another Room
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50">
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <Button onClick={onBack} variant="ghost" size="sm" className="p-2 hover:bg-blue-50">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>
          <h1 className="text-xl font-semibold">Create Bubble</h1>
          <div className="w-9" />
        </div>

        {/* Room Name */}
        <div className="space-y-3">
          <Label htmlFor="roomName" className="text-lg">Room Name</Label>
          <Input
            id="roomName"
            placeholder="e.g., Team Alpha Demo"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="h-12 text-lg rounded-2xl border-2"
          />
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
          <h3 className="font-semibold text-lg">Audio Settings</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Push to Talk</Label>
                <p className="text-sm text-gray-500">Tap and hold to speak</p>
              </div>
              <Switch checked={pushToTalk} onCheckedChange={setPushToTalk} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Live Captions</Label>
                <p className="text-sm text-gray-500">Real-time transcription</p>
              </div>
              <Switch checked={transcription} onCheckedChange={setTranscription} />
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div className="pt-4">
          <Button 
            onClick={createRoom} 
            className="w-full h-14 text-lg rounded-2xl shadow-md" 
            size="lg"
            disabled={!roomName.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Audio Bubble'}
          </Button>
        </div>
      </div>
    </div>
  );
}