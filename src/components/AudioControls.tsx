import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio,
  Crown,
  KeyRound,
  Hand
} from 'lucide-react';
import { usePTT } from '../webrtc';

interface AudioControlsProps {
  isMuted: boolean;
  volume: number;
  isPushToTalk: boolean;
  isPresenterMode: boolean;
  onMuteToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onPushToTalkToggle: (enabled: boolean) => void;
  onPresenterModeToggle: (enabled: boolean) => void;
}

export function AudioControls({
  isMuted,
  volume,
  isPushToTalk,
  isPresenterMode,
  onMuteToggle,
  onVolumeChange,
  onPushToTalkToggle,
  onPresenterModeToggle
}: AudioControlsProps) {
  const [micLevel, setMicLevel] = useState(0);

  // Use PTT hook for keyboard and touch handling
  const { isActive: isPTTActive, startPTT, stopPTT } = usePTT(
    isPushToTalk,
    () => {
      // PTT start - unmute temporarily
      if (isMuted) {
        onMuteToggle();
      }
    },
    () => {
      // PTT end - mute if was originally muted
      if (isMuted) {
        onMuteToggle();
      }
    },
    'Space'
  );

  // Simulate microphone input level
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMuted && (!isPushToTalk || isPTTActive)) {
        setMicLevel(Math.random() * 100);
      } else {
        setMicLevel(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isMuted, isPushToTalk, isPTTActive]);

  const isMicActive = !isMuted && (!isPushToTalk || isPTTActive);

  const handlePushToTalkStart = () => {
    startPTT();
  };

  const handlePushToTalkEnd = () => {
    stopPTT();
  };

  return (
    <div className="space-y-8" role="region" aria-labelledby="audio-controls-heading">
      <h2 id="audio-controls-heading" className="sr-only">Audio Controls</h2>

      {/* Main Mic Control */}
      <div className="flex items-center justify-center space-x-4" role="group" aria-labelledby="mic-control-heading">
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
                isPTTActive 
                  ? 'bg-green-600 text-white scale-110 shadow-xl' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              aria-label={isPTTActive ? 'Speaking - release to stop' : 'Push and hold to speak'}
              aria-pressed={isPTTActive}
              role="button"
              aria-describedby="push-to-talk-desc"
            >
              {isPTTActive ? (
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
                ? (isPTTActive ? 'Speaking' : 'Hold to Talk') 
                : (isMuted ? 'Muted' : 'Live')
              }
            </p>
            {isPushToTalk && !isPTTActive && (
              <p className="text-xs text-gray-500 mt-1" id="push-to-talk-desc">
                Tap and hold button or press Spacebar to speak
              </p>
            )}
            {!isPushToTalk && (
              <p className="sr-only" id="mute-toggle-desc">
                {isMuted ? 'Microphone is currently muted' : 'Microphone is currently active'}
              </p>
            )}
          </div>
        </div>

        {/* Mic Level Indicator */}
        <div className="flex flex-col items-center space-y-2" role="img" aria-labelledby="mic-level-label">
          <div 
            className="h-24 w-4 bg-gray-200 rounded-full overflow-hidden"
            aria-hidden="true"
          >
            <div 
              className="w-full bg-gradient-to-t from-green-400 via-yellow-400 to-red-400 transition-all duration-100 ease-out rounded-full"
              style={{ height: `${micLevel}%`, marginTop: 'auto' }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center" id="mic-level-label">
            Input Level: {Math.round(micLevel)}%
          </p>
          <div className="sr-only" aria-live="polite">
            {micLevel > 80 && 'High input level'}
            {micLevel > 50 && micLevel <= 80 && 'Medium input level'}
            {micLevel <= 50 && micLevel > 0 && 'Low input level'}
            {micLevel === 0 && 'No input detected'}
          </div>
        </div>
      </div>

      {/* Volume Control */}
      <div className="space-y-4" role="group" aria-labelledby="volume-control-heading">
        <h3 id="volume-control-heading" className="sr-only">Volume Control</h3>
        
        <div className="flex items-center justify-between">
          <Label className="flex items-center space-x-2 text-base" htmlFor="volume-slider">
            {volume > 0 ? (
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            ) : (
              <VolumeX className="h-5 w-5" aria-hidden="true" />
            )}
            <span>Volume</span>
          </Label>
          <span 
            className="text-sm text-gray-500 font-medium" 
            aria-live="polite"
            aria-label={`Current volume: ${volume} percent`}
          >
            {volume}%
          </span>
        </div>
        <Slider
          id="volume-slider"
          value={[volume]}
          onValueChange={(value) => onVolumeChange(value[0])}
          max={100}
          step={5}
          className="w-full"
          aria-label={`Volume control, currently ${volume}%`}
        />
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

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="h-5 w-5 text-gray-600" aria-hidden="true" />
            <div>
              <Label className="text-base" htmlFor="presenter-mode-switch">Presenter Mode</Label>
              <p className="text-sm text-gray-500">Boost your voice volume</p>
            </div>
          </div>
          <Switch 
            id="presenter-mode-switch"
            checked={isPresenterMode} 
            onCheckedChange={onPresenterModeToggle}
            aria-label={`Presenter mode ${isPresenterMode ? 'enabled' : 'disabled'}`}
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

        {isPresenterMode && (
          <div className="bg-yellow-50 p-4 rounded-2xl" role="alert" aria-live="polite">
            <p className="text-sm text-yellow-800">
              <Crown className="h-4 w-4 inline mr-2" aria-hidden="true" />
              <span className="font-medium">Presenter Mode active.</span> Your voice is boosted for all participants.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}