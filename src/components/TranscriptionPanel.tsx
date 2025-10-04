import React, { useRef, useEffect } from 'react';
import { useTranscription } from '../hooks/useTranscription';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, Share2, Trash2, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';

interface TranscriptionPanelProps {
  stream: MediaStream | null;
  userId: string;
}

export function TranscriptionPanel({ stream, userId }: TranscriptionPanelProps) {
  const { 
    transcripts, 
    currentInterim, 
    isListening, 
    startListening, 
    stopListening,
    clearTranscripts 
  } = useTranscription(stream, userId, {
    enabled: true,
    language: 'en-US',
    continuous: true,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, currentInterim]);

  const downloadTranscript = () => {
    if (transcripts.length === 0) {
      toast.error('No transcripts to download');
      return;
    }

    const content = transcripts
      .map(t => `[${t.timestamp}] ${t.speaker}: ${t.text}`)
      .join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Transcript downloaded');
  };

  const shareTranscript = async () => {
    if (transcripts.length === 0) {
      toast.error('No transcripts to share');
      return;
    }

    const content = transcripts
      .map(t => `[${t.timestamp}] ${t.speaker}: ${t.text}`)
      .join('\n\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Audio Bubble Transcript',
          text: content,
        });
        toast.success('Transcript shared');
      } catch (error) {
        // User cancelled or share failed, copy to clipboard instead
        navigator.clipboard.writeText(content);
        toast.success('Transcript copied to clipboard');
      }
    } else {
      navigator.clipboard.writeText(content);
      toast.success('Transcript copied to clipboard');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.8) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className={`w-3 h-3 rounded-full ${
              isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
            }`} 
          />
          <span className="font-medium">
            {isListening ? 'Live Captions' : 'Paused'}
          </span>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={isListening ? stopListening : startListening}
            variant="outline" 
            size="sm"
            className="h-8"
            disabled={!stream}
          >
            {isListening ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
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

          <Button 
            onClick={clearTranscripts} 
            variant="outline" 
            size="sm"
            disabled={transcripts.length === 0}
            className="h-8"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Transcription Display */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto border rounded-2xl p-4 bg-gray-50"
        >
          {!stream && !currentInterim ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center space-y-3">
                <div className="w-4 h-4 bg-gray-400 rounded-full mx-auto" />
                <p className="text-sm">Microphone access needed for live captions</p>
                <p className="text-xs opacity-75">Allow microphone permission to enable transcription</p>
              </div>
            </div>
          ) : transcripts.length === 0 && !currentInterim ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center space-y-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mx-auto" />
                <p className="text-sm">
                  {isListening ? 'Listening for speech...' : 'Click Resume to start transcribing'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Final Transcripts */}
              {transcripts.map((transcript) => (
                <div key={transcript.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {transcript.speaker}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getConfidenceColor(transcript.confidence)}`}
                      >
                        {Math.round(transcript.confidence * 100)}%
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {transcript.timestamp}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border-l-4 border-blue-200">
                    <p className="leading-relaxed text-sm">
                      {transcript.text}
                    </p>
                  </div>
                </div>
              ))}

              {/* Interim Results (live preview) */}
              {currentInterim && (
                <div className="space-y-2 opacity-60">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">You</span>
                    <Badge variant="secondary" className="text-xs">
                      typing...
                    </Badge>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl border-l-4 border-blue-400">
                    <p className="leading-relaxed text-sm italic">
                      {currentInterim}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Footer */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-2xl space-y-1">
        <p>🎙️ Real-time speech-to-text powered by Web Speech API</p>
        <p>📊 Confidence scores indicate transcription accuracy</p>
        <p>💬 Works best in Chrome, Edge, or Safari</p>
      </div>
    </div>
  );
}