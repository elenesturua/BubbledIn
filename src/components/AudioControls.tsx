import { useState } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { 
  Mic, 
  MicOff, 
  KeyRound,
  Hand
} from 'lucide-react';

interface AudioControlsProps {
  isMuted: boolean;
  volume: number;
  isPushToTalk: boolean;
  onMuteToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onPushToTalkToggle: (enabled: boolean) => void;
  onPushToTalkPress: (pressed: boolean) => void;
}

export function AudioControls({
  isMuted,
  volume,
  isPushToTalk,
  onMuteToggle,
  onVolumeChange,
  onPushToTalkToggle,
  onPushToTalkPress
}: AudioControlsProps) {
  const [isTouchPressed, setIsTouchPressed] = useState(false);

  const isMicActive = !isMuted && (!isPushToTalk || isTouchPressed);

  const handlePushToTalkStart = () => {
    console.log('🎤 PTT Start triggered');
    setIsTouchPressed(true);
    onPushToTalkPress(true);
  };

  const handlePushToTalkEnd = () => {
    console.log('🎤 PTT End triggered');
    setIsTouchPressed(false);
    onPushToTalkPress(false);
  };

  return (
    <div className="space-y-8" role="region" aria-labelledby="audio-controls-heading">
      <h2 id="audio-controls-heading" className="sr-only">Audio Controls</h2>

      {/* Main Mic Control */}
      <div className="flex items-center justify-center" role="group" aria-labelledby="mic-control-heading">
        <h3 id="mic-control-heading" className="sr-only">Microphone Control</h3>
        
        <div className="flex flex-col items-center space-y-4">
          {isPushToTalk ? (
            <button
              onTouchStart={handlePushToTalkStart}
              onTouchEnd={handlePushToTalkEnd}
              onMouseDown={handlePushToTalkStart}
              onMouseUp={handlePushToTalkEnd}
              onMouseLeave={handlePushToTalkEnd}
              className={`w-24 h-24 rounded-full transition-all duration-150 flex items-center justify-center shadow-lg select-none focus-ring touch-target ${
                isTouchPressed 
                  ? 'bg-green-600 text-white scale-110 shadow-xl' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              aria-label={isTouchPressed ? 'Speaking - release to stop' : 'Push and hold to speak'}
              aria-pressed={isTouchPressed}
              role="button"
              aria-describedby="push-to-talk-desc"
            >
              {isTouchPressed ? (
                <Mic className="h-10 w-10" aria-hidden="true" />
              ) : (
                <Hand className="h-10 w-10" aria-hidden="true" />
              )}
            </button>
          ) : (
            <Button
              onClick={onMuteToggle}
              size="lg"
              variant={isMicActive ? "default" : "destructive"}
              className="w-24 h-24 rounded-full shadow-lg"
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMicActive ? (
                <Mic className="h-10 w-10" aria-hidden="true" />
              ) : (
                <MicOff className="h-10 w-10" aria-hidden="true" />
              )}
            </Button>
          )}
          
          <div className="text-center">
            <p className="font-medium" aria-live="polite">
              {isPushToTalk 
                ? (isTouchPressed ? 'Speaking' : 'Hold to Talk') 
                : (isMuted ? 'Muted' : 'Live')
              }
            </p>
            {isPushToTalk && !isTouchPressed && (
              <p className="text-xs text-gray-500 mt-1" id="push-to-talk-desc">
                Tap and hold button to speak
              </p>
            )}
            {!isPushToTalk && (
              <p className="sr-only" id="mute-toggle-desc">
                {isMuted ? 'Microphone is currently muted' : 'Microphone is currently active'}
              </p>
            )}
          </div>
        </div>

      </div>


      {/* Settings */}
      <div className="space-y-6" role="group" aria-labelledby="audio-settings-heading">
        <h3 id="audio-settings-heading" className="sr-only">Audio Settings</h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <KeyRound className="h-5 w-5 text-gray-600" aria-hidden="true" />
            <div>
              <Label className="text-base" htmlFor="push-to-talk-switch">Push to Talk</Label>
              <p className="text-sm text-gray-500">Touch and hold to speak</p>
            </div>
          </div>
          <Switch 
            id="push-to-talk-switch"
            checked={isPushToTalk} 
            onCheckedChange={onPushToTalkToggle}
            aria-label={`Push to talk ${isPushToTalk ? 'enabled' : 'disabled'}`}
          />
        </div>

        {isPushToTalk && (
          <div className="bg-blue-50 p-4 rounded-2xl" role="alert" aria-live="polite">
            <p className="text-sm text-blue-800">
              <Hand className="h-4 w-4 inline mr-2" aria-hidden="true" />
              <span className="font-medium">Push to Talk is active.</span> Touch and hold the microphone button to speak.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}