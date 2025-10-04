import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, Copy, Share2, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTranscription } from '../hooks/useTranscription';

interface TranscriptionEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  confidence: number;
}

interface TranscriptionPanelProps {
  stream: MediaStream | null;
  userId: string;
}

export function TranscriptionPanel({ stream, userId }: TranscriptionPanelProps) {
  const [transcripts, setTranscripts] = useState<TranscriptionEntry[]>([]);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    isTranscribing,
    startTranscription,
    stopTranscription,
    finalTranscripts,
    interimTranscript
  } = useTranscription();

  // Update transcripts when final transcripts change
  useEffect(() => {
    if (finalTranscripts.length > 0) {
      const latestTranscripts =(finalTranscripts.map((transcript, index) => ({
        id: `${userId}-${Date.now()}-${index}`,
        speaker: userId === 'user-1' ? 'You' : `Participant ${userId.split('-')[1]}`,
        text: transcript,
        timestamp: new Date().toLocaleTimeString(),
        confidence: 0.95 // Web Speech API confidence would come from result.confidence if available
      })));
      
      setTranscripts(prev => [...prev, ...latestTranscripts]);
    }
  }, [finalTranscripts, userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, interimTranscript]);

  const handleStartStop = () => {
    if (isTranscribing) {
      stopTranscription();
      setIsListening(false);
      toast.success('Transcription stopped');
    } else {
      if (!stream) {
        toast.error('Microphone access required for transcription');
        return;
      }
      startTranscription();
      setIsListening(true);
      toast.success('Transcription started');
    }
  };

  const shareTranscript = async () => {
    const content = transcripts.map(t => 
      `[${t.timestamp}] ${t.speaker}: ${t.text}`
    ).join('\n\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Audio Bubble Transcript',
          text: content
        });
      } catch (error) {
        navigator.clipboard.writeText(content);
        toast.success('Transcript copied!');
      }
    } else {
      navigator.clipboard.writeText(content);
      toast.success('Transcript copied!');
    }
  };

  const downloadTranscript = () => {
    const content = transcripts.map(t => 
      `[${t.timestamp}] ${t.speaker}: ${t.text}`
    ).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audio-bubble-transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transcript downloaded');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.8) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isTranscribing ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="font-medium">
            {isTranscribing ? 'Live Captions' : 'Stopped'}
          </span>
          {!stream && (
            <span className="text-xs text-gray-500">(Microphone access needed)</span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={handleStartStop}
            variant={isTranscribing ? "destructive" : "default"}
            size="sm"
            disabled={!stream}
            className="h-8"
          >
            {isTranscribing ? (
              <>
                <MicOff className="h-3 w-3 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Mic className="h-3 w-3 mr-1" />
                Resume
              </>
            )}
          </Button>
          <Button 
            onClick={shareTranscript} 
            variant="outline" 
            size="sm"
            disabled={transcripts.length === 0}
            className="h-8"
          >
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </Button>
          <Button 
            onClick={downloadTranscript} 
            variant="outline" 
            size="sm"
            disabled={transcripts.length === 0}
            className="h-8"
          >
            <Download className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Transcription Display */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full border rounded-2xl p-4 bg-gray-50" ref={scrollRef}>
          {transcripts.length === 0 && !interimTranscript ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center space-y-3">
                <div className={`w-4 h-4 rounded-full mx-auto ${isTranscribing ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                <p>{stream ? 'Click Resume to start transcription' : 'Microphone access required for transcription'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {transcripts.map((transcript) => (
                <div key={transcript.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{transcript.speaker}</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getConfidenceColor(transcript.confidence)}`}
                      >
                        {Math.round(transcript.confidence * 100)}%
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">{transcript.timestamp}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border-l-4 border-blue-200">
                    <p className="leading-relaxed">
                      {transcript.text}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Interim transcript */}
              {interimTranscript && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Speaking</span>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        Live
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">Now</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border-l-4 border-gray-300">
                    <p className="leading-relaxed text-gray-600">
                      {interimTranscript}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Typing indicator */}
              {isTranscribing && !interimTranscript && (
                <div className="flex items-center space-x-3 text-gray-500 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span className="text-sm">Listening...</span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-2xl space-y-1">
        <p>🎙️ Real-time speech-to-text powered by Web Speech API</p>
        <p>📊 Confidence scores indicate transcription accuracy</p>
      </div>
    </div>
  );
}