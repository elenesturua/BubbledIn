import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Camera, QrCode, Loader2, Scan, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeScanner } from './QRCodeScanner';
import { roomStorage } from '../services/roomStorage';

interface JoinRoomProps {
  onBack: () => void;
  onRoomJoined: (roomData: any) => void;
}

export function JoinRoom({ onBack, onRoomJoined }: JoinRoomProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'code'>('scan');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Camera access denied. Try entering room code instead.');
      setActiveTab('code');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const joinByCode = async () => {
    if (!roomCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }

    setIsJoining(true);
    
    // Try to join the room
    const roomId = roomCode.toUpperCase();
    const result = roomStorage.joinRoom(roomId);
    
    setTimeout(() => {
      setIsJoining(false);
      
      if (result.success && result.room) {
        // Convert stored room to room data format
        const roomData = {
          id: result.room.id,
          name: result.room.name,
          host: false,
          settings: result.room.settings,
          url: result.room.url,
          participants: result.room.participants
        };
        
        onRoomJoined(roomData);
        toast.success(`Joined "${result.room.name}" successfully!`);
      } else {
        toast.error(`Room "${roomId}" not found. Check the code or QR code again.`);
      }
    }, 500);
  };

  const handleQRCodeScanned = (qrData: string) => {
    console.log('QR Code scanned:', qrData);
    
    // Extract room ID from URL
    const roomMatch = qrData.match(/room=([^&]+)/);
    if (roomMatch) {
      const roomId = roomMatch[1];
      
      // Try to join the room
      const result = roomStorage.joinRoom(roomId);
      
      if (result.success && result.room) {
        // Convert stored room to room data format
        const roomData = {
          id: result.room.id,
          name: result.room.name,
          host: false,
          settings: result.room.settings,
          url: result.room.url,
          participants: result.room.participants
        };
        
        onRoomJoined(roomData);
        toast.success(`Joined "${result.room.name}" via QR code!`);
      } else {
        toast.error(`Room "${roomId}" not found or no longer exists.`);
      }
    } else {
      toast.error('Invalid QR code format');
    }
  };

  // Simulate QR code detection
  const simulateQRDetection = () => {
    const mockRoomData = {
      id: 'DEMO123',
      name: 'Scanned Demo Room',
      host: false,
      settings: {
        pushToTalk: true,
        presenterMode: false,
        transcription: true
      }
    };
    
    stopCamera();
    onRoomJoined(mockRoomData);
    toast.success('QR code detected! Joining...');
  };

  useEffect(() => {
    // Auto-start camera when scan tab is active
    if (activeTab === 'scan' && !isScanning) {
      startCamera();
    } else if (activeTab === 'code') {
      stopCamera();
    }
  }, [activeTab]);

  useEffect(() => {
    // Cleanup camera on unmount
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50">
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <Button onClick={onBack} variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Join Bubble</h1>
          <div className="w-9" />
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-100 rounded-2xl p-1 grid grid-cols-2">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center justify-center space-x-2 py-3 rounded-xl transition-all ${
              activeTab === 'scan' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-gray-600'
            }`}
          >
            <Scan className="h-4 w-4" />
            <span className="font-medium">Scan QR</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center justify-center space-x-2 py-3 rounded-xl transition-all ${
              activeTab === 'code' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-gray-600'
            }`}
          >
            <Hash className="h-4 w-4" />
            <span className="font-medium">Enter Code</span>
          </button>
        </div>

        {/* QR Scanner Tab */}
        {activeTab === 'scan' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              {!isScanning ? (
                <div className="text-center space-y-6">
                  <div className="w-48 h-48 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Camera className="h-16 w-16 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Camera Access</h3>
                    <p className="text-gray-600">Allow camera access to scan QR codes</p>
                  </div>
                  <Button onClick={() => setShowQRScanner(true)} size="lg" className="w-full h-12 rounded-2xl">
                    <Camera className="h-5 w-5 mr-3" />
                    Open QR Scanner
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-square bg-black rounded-2xl overflow-hidden relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white border-dashed rounded-2xl flex items-center justify-center">
                        <div className="text-white text-center">
                          <QrCode className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">Position QR code here</p>
                        </div>
                      </div>
                    </div>
                    {/* Animated scanning line */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-0.5 bg-blue-500 animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button onClick={simulateQRDetection} className="flex-1 h-12 rounded-2xl">
                      Simulate Scan
                    </Button>
                    <Button onClick={stopCamera} variant="outline" className="h-12 px-6 rounded-2xl">
                      Stop
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Code Entry Tab */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Enter Room Code</h3>
                <p className="text-gray-600">Type the 6-character room code</p>
              </div>
              
              <div className="space-y-4">
                <Input
                  placeholder="ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="h-14 text-xl text-center tracking-wider font-mono rounded-2xl border-2"
                  maxLength={6}
                />
                
                <Button 
                  onClick={joinByCode} 
                  className="w-full h-12 rounded-2xl" 
                  size="lg"
                  disabled={isJoining || roomCode.length < 3}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Audio Bubble'
                  )}
                </Button>
              </div>
            </div>

            {/* Help text */}
            <div className="text-center space-y-2 px-4">
              <p className="text-sm text-gray-500">
                Ask the host to show you the QR code or share the room code
              </p>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRCodeScanner
          onQRCodeScanned={handleQRCodeScanned}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}