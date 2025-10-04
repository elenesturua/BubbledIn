import React, { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

interface QRCodeScannerProps {
  onQRCodeScanned: (data: string) => void;
  onClose: () => void;
}

export function QRCodeScanner({ onQRCodeScanned, onClose }: QRCodeScannerProps) {
  const [error, setError] = useState<string | null>(null);

  const handleScan = (detected: any[]) => {
    if (detected && detected.length > 0) {
      // The scanner returns an array of detected barcodes. Try to read the first detected value.
      const first = detected[0];
      const data = first?.rawValue || first?.rawText || (typeof first === 'string' ? first : undefined);

      if (typeof data === 'string') {
        if (data.includes("?room=") || data.includes("/room/")) {
          toast.success("Room QR code detected!");
          onQRCodeScanned(data);
        } else {
          setError("❌ Invalid QR code");
          // Auto-clear after 3 seconds
          setTimeout(() => setError(null), 3000);
        }
      }
    }
  };


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

        {/* QR Scanner */}
        <div className="aspect-square rounded-2xl overflow-hidden mb-4">
            <Scanner
              constraints={{ facingMode: "environment" }}
              onScan={(result) => handleScan(result)}
              onError={(error) => console.log(error)}
              allowMultiple={false}
            />
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-2xl border border-red-200 text-center">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <Button onClick={onClose} variant="outline" className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );
}