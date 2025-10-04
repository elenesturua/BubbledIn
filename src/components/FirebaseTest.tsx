import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { signaling } from '../webrtc/signaling';
import { authService } from '../firebase/auth';

export function FirebaseTest() {
  const [status, setStatus] = useState('Ready to test');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check initial auth state
    const userId = authService.getCurrentUserId();
    setUserId(userId);
    setStatus(userId ? 'Already authenticated' : 'Not authenticated');
  }, []);

  const testFirebaseAuth = async () => {
    setIsLoading(true);
    setStatus('Testing Firebase Authentication...');
    
    try {
      await authService.signInAnonymously();
      const newUserId = authService.getCurrentUserId();
      setUserId(newUserId);
      setStatus(`✅ Firebase Auth Success! User ID: ${newUserId}`);
    } catch (error) {
      setStatus(`❌ Firebase Auth Failed: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  const testRoomCreation = async () => {
    if (!userId) {
      setStatus('❌ Please authenticate first');
      return;
    }

    setIsLoading(true);
    setStatus('Testing Room Creation...');
    
    try {
      const roomData = await signaling.createRoom('Test Room', {
        pushToTalk: false,
        presenterMode: false,
        transcription: true
      });
      
      setStatus(`✅ Room Created! ID: ${roomData.id}, Name: ${roomData.name}`);
    } catch (error) {
      setStatus(`❌ Room Creation Failed: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  const testRoomJoin = async () => {
    if (!userId) {
        setStatus('❌ Please authenticate first');
        return;
      }

      setIsLoading(true);
      setStatus('Testing Room Join...');
      
      try {
        // Try to join a test room (will create if doesn't exist)
        const roomData = await signaling.joinRoom('TEST123', 'Test User');
        
        setStatus(`✅ Room Joined! ID: ${roomData.id}, Name: ${roomData.name}`);
      } catch (error) {
        setStatus(`❌ Room Join Failed: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Firebase & WebRTC Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium mb-2">Current Status:</h4>
          <p className="text-sm">{status}</p>
          {userId && (
            <p className="text-xs text-gray-600 mt-1">User ID: {userId}</p>
          )}
        </div>

        <div className="space-y-2">
          <Button 
            onClick={testFirebaseAuth} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : '1. Test Firebase Auth'}
          </Button>

          <Button 
            onClick={testRoomCreation} 
            disabled={isLoading || !userId}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Testing...' : '2. Test Room Creation'}
          </Button>

          <Button 
            onClick={testRoomJoin} 
            disabled={isLoading || !userId}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Testing...' : '3. Test Room Join'}
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>🔧 Make sure Firebase services are enabled in Console</p>
          <p>🔧 Check browser console for detailed logs</p>
        </div>
      </CardContent>
    </Card>
  );
}
