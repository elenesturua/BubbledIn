import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import QrScanner from 'qr-scanner';

interface QRCodeScannerProps {
  onQRCodeScanned: (data: string) => void;
  onClose: () => void;
}

export function QRCodeScanner({ onQRCodeScanned, onClose }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const scannerRef = useRef<QrScanner | null>(null);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => handleQRCodeDetected(result.data),
        {
          returnDetailedScanResult: true,
          onDecodeError: (error) => {
            // Ignore common decode errors
            console.log('QR decode error:', error);
          }
        }
      );

      await scanner.start();
      scannerRef.current = scanner;
      setIsScanning(true);
      setError(null);
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);


  const handleQRCodeDetected = useCallback((data: string) => {
    if (!scannedCodes.includes(data)) {
      setScannedCodes(prev => [...prev, data]);
      
      // Check if it's a valid room URL
      if (data.includes('?room=') || data.includes('/room/')) {
        toast.success('Room QR code detected!');
        onQRCodeScanned(data);
        stopCamera();
      } else {
        toast.error('Invalid QR code');
      }
    }
  }, [scannedCodes, onQRCodeScanned, stopCamera]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Scan QR Code</h2>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Camera Preview */}
        <div className="relative mb-6">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
            />
            
            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 border-4 border-blue-500">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg"></div>
                </div>
              </div>
            )}
          </div>

          {/* Status indicator */}
          <div className="mt-4 text-center">
            {isScanning ? (
              <div className="flex items-center justify-center text-blue-600">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scanning for QR codes...
              </div>
            ) : (
              <p className="text-gray-600">Position QR code within frame</p>
            )}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-200">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3">
          {!isScanning ? (
            <Button onClick={startCamera} className="w-full" size="lg">
              <Camera className="h-5 w-5 mr-2" />
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="outline" className="w-full" size="lg">
              Stop Scanning
            </Button>
          )}
          
          <Button onClick={onClose} variant="ghost" className="w-full">
            Cancel
          </Button>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
          <p className="text-sm text-blue-800">
            <strong>Instructions:</strong><br/>
            1. Position the QR code within the frame<br/>
            2. Hold steady until detected<br/>
            3. QR code should contain room URL
          </p>
        </div>
      </div>
    </div>
  );
}
