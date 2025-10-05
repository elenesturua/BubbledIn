import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { User, Check } from 'lucide-react';
import { toast } from 'sonner';

interface DisplayNameModalProps {
  isOpen: boolean;
  onConfirm: (displayName: string) => void;
  onCancel: () => void;
}

export function DisplayNameModal({ isOpen, onConfirm, onCancel }: DisplayNameModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle mobile viewport and prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll on mobile
      document.body.style.overflow = 'hidden';
      // Add mobile viewport meta tag handling
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
      // Restore normal viewport
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast.error('Please enter your display name');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(displayName.trim());
    } catch (error) {
      console.error('Failed to set display name:', error);
      toast.error('Failed to set display name. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDisplayName('');
    onCancel();
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Welcome to the Audio Bubble!
        </h2>
      </div>
      
      <div className="space-y-6">
        {/* Welcome Icon */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            Please enter your display name to join the conversation
          </p>
        </div>

        {/* Display Name Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-sm font-medium text-gray-700">
              Display Name
            </Label>
            <Input
              id="displayName"
              placeholder="e.g., John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-12 text-base rounded-xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 touch-manipulation"
              autoFocus
              maxLength={50}
              autoComplete="name"
              inputMode="text"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 pt-2 sm:flex-row sm:space-y-0 sm:space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full h-12 rounded-xl border-2 text-gray-700 hover:bg-gray-50 touch-manipulation min-h-[44px]"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium touch-manipulation min-h-[44px]"
              disabled={!displayName.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Join Bubble
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
