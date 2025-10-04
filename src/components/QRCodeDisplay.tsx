import React, { useEffect, useRef, useState } from 'react';
import { QrCode, Copy, Share2, Camera, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import QRCodeLib from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      if (canvasRef.current) {
        try {
          await QRCodeLib.toCanvas(canvasRef.current, value, {
            width: size,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrGenerated(true);
        } catch (error) {
          console.error('Error generating QR code:', error);
          toast.error('Failed to generate QR code');
        }
      }
    };

    generateQR();
  }, [value, size]);

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
        {/* Actual QR Code */}
        <div className="flex flex-col items-center space-y-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <canvas ref={canvasRef} className="block" />
            {!qrGenerated && (
              <div className="flex items-center justify-center text-gray-500 text-sm mt-2">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating QR code...
              </div>
            )}
          </div>
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
            📱 Share this QR code with others to join your audio bubble
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Scan with camera to join instantly
          </p>
        </div>
      </div>
    </div>
  );
}