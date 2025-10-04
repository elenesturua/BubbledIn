import { QrCode, Copy, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    toast.success('Room link copied!');
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Audio Bubble',
          text: 'Join our audio bubble room',
          url: value
        });
      } catch (error) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  // Extract room ID from URL for display
  const roomId = value.includes('?room=') ? value.split('?room=')[1] : 'UNKNOWN';

  return (
    <div className="flex justify-center">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center max-w-sm w-full">
        {/* Visual QR placeholder */}
        <div className="w-48 h-48 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex flex-col items-center justify-center mx-auto mb-6 border-2 border-blue-100">
          <QrCode className="h-16 w-16 text-blue-600 mb-4" />
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-gray-700">Room Code</p>
            <p className="text-2xl font-mono font-bold text-blue-600">{roomId}</p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="space-y-3">
          <Button onClick={shareLink} className="w-full" size="lg">
            <Share2 className="h-4 w-4 mr-2" />
            Share Room
          </Button>
          
          <Button onClick={copyToClipboard} variant="outline" className="w-full" size="lg">
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-xl">
          <p className="text-xs text-blue-700">
            📱 Share this code with others to join your audio bubble
          </p>
        </div>
      </div>
    </div>
  );
}