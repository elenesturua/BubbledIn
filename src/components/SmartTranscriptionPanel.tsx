import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, Copy, Share2, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { smartTranscription } from '../services/SmartTranscription';

interface TranscriptionEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  confidence: number;
  source?: 'web-speech' | 'gemini' | 'hybrid';
}

export function SmartTranscriptionPanel({ stream, userId }: { stream: MediaStream | null; userId: string }) {
  const [transcripts, setTranscripts] = useState<TranscriptionEntry[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<'started' | 'stopped' | 'listening'>('stopped');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Initialize smart transcription service
  useEffect(() => {
    smartTranscription.setCallbacks({
      onTranscription: (entry: TranscriptionEntry) => {
        console.log('📝 Received transcription:', entry);
        setTranscripts(prev => [...prev, entry]);
      },
      onError: (error: string) => {
        console.error('❌ Transcription error:', error);
        toast.error(`Transcription error: ${error}`);
      },
      onStatusChange: (newStatus: 'started' | 'stopped' | 'listening') => {
        console.log('📢 Transcription status changed:', newStatus);
        setStatus(newStatus);
      }
    });

    return () => {
      smartTranscription.destroy();
    };
  }, []);

  // Start/stop listening based on isListening state
  useEffect(() => {
    if (isListening && status === 'stopped') {
      smartTranscription.startListening();
      toast.success('🎤 Smart transcription started - Web Speech + Gemini AI');
    } else if (!isListening && status !== 'stopped') {
      smartTranscription.stopListening();
      toast.info('🛑 Transcription stopped');
    }
  }, [isListening, status]);

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const clearTranscripts = () => {
    setTranscripts([]);
    toast.info('Cleared all transcripts');
  };

  const downloadTranscripts = () => {
    const transcriptText = transcripts
      .map(t => `[${t.timestamp}] ${t.speaker}: ${t.text}`)
      .join('\n');

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Transcript downloaded');
  };

  const copyTranscriptsToClipboard = () => {
    const transcriptText = transcripts
      .map(t => `[${t.timestamp}] ${t.speaker}: ${t.text}`)
      .join('\n');

    navigator.clipboard.writeText(transcriptText);
    toast.success('Transcript copied to clipboard');
  };

  const shareTranscripts = async () => {
    const transcriptText = transcripts
      .map(t => `[${t.timestamp}] ${t.speaker}: ${t.text}`)
      .join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Audio Bubble Transcript',
          text: transcriptText,
        });
        toast.success('Transcript shared');
      } catch (error) {
        copyTranscriptsToClipboard();
      }
    } else {
      copyTranscriptsToClipboard();
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'web-speech':
        return '🎤';
      case 'gemini':
        return '🤖';
      case 'hybrid':
        return '✨';
      default:
        return '📝';
    }
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'web-speech':
        return 'text-blue-600';
      case 'gemini':
        return 'text-purple-600';
      case 'hybrid':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 rounded-2xl p-4">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            status === 'listening' ? 'bg-green-500 animate-pulse' : 
            status === 'started' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
          }`} />
          <span className="text-sm font-medium">
            {status === 'listening' ? 'Listening...' : 
             status === 'started' ? 'Processing...' : 'Stopped'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={toggleListening}
            variant={isListening ? "default" : "outline"}
            size="sm"
            className="text-xs"
          >
            {isListening ? (
              <MicOff className="h-3 w-3 mr-1" />
            ) : (
              <Mic className="h-3 w-3 mr-1" />
            )}
            {isListening ? 'Stop' : 'Start'}
          </Button>
          {transcripts.length > 0 && (
            <Button
              onClick={clearTranscripts}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {transcripts.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button
            onClick={downloadTranscripts}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <Button
            onClick={copyTranscriptsToClipboard}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          <Button
            onClick={shareTranscripts}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </Button>
        </div>
      )}

      {/* Transcripts Display */}
      <ScrollArea className="h-full w-full border rounded-2xl p-4 bg-white" ref={scrollRef}>
        {transcripts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center space-y-3">
              <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${
                isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
              }`}>
                {isListening ? '🎤' : '🔇'}
              </div>
              <p className="font-medium">
                {isListening ? 'Listening for speech...' : 'Click mic to start transcription'}
              </p>
              <div className="text-xs space-y-1">
                <p className="text-gray-400">Powered by Web Speech API + Gemini AI</p>
                <p className="text-blue-600 font-medium">
                  🤖 AI-enhanced accuracy for real conversations
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {transcripts.map((transcript) => (
              <div key={transcript.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-blue-600">{transcript.speaker}</span>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getConfidenceColor(transcript.confidence)}`}
                    >
                      {Math.round(transcript.confidence * 100)}%
                    </Badge>
                    <span 
                      className={`text-sm ${getSourceColor(transcript.source)}`}
                      title={`Source: ${transcript.source || 'unknown'}`}
                    >
                      {getSourceIcon(transcript.source)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{transcript.timestamp}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border-l-4 border-blue-200 shadow-sm">
                  <p className="leading-relaxed text-gray-800">
                    {transcript.text}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Live indicator */}
            {isListening && (
              <div className="flex items-center space-x-3 text-gray-500 py-3 bg-blue-50 rounded-xl pl-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm font-medium">AI processing audio...</span>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Info Footer */}
      <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-xl space-y-1 mt-4">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span>🎤</span>
            <span>Real-time capture</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>🤖</span>
            <span>AI enhancement</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>✨</span>
            <span>Smart corrections</span>
          </span>
        </div>
        <p className="text-gray-400 mt-1">
          {isListening ? 'Speak naturally - AI will enhance accuracy' : 'Click mic to enable transcription'}
        </p>
      </div>
    </div>
  );
}
