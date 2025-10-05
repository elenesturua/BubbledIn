import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
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
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Welcome to the Audio Bubble!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Welcome Icon */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-gray-600">
              Please enter your display name to join the conversation
            </p>
          </div>

          {/* Display Name Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-base font-medium">
                Display Name
              </Label>
              <Input
                id="displayName"
                placeholder="e.g., John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-12 text-lg rounded-xl border-2"
                autoFocus
                maxLength={50}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1 h-12 rounded-xl"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 rounded-xl"
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
      </DialogContent>
    </Dialog>
  );
}
