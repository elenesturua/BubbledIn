import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, Copy, Share2, Mic } from 'lucide-react';
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

export function TranscriptionPanel({ stream, userId }: { stream: MediaStream | null; userId: string }) {
  const [transcripts, setTranscripts] = useState<TranscriptionEntry[]>([]);
  const [isListening, setIsListening] = useState(true);
  const [currentSpeaker, setCurrentSpeaker] = useState<string>('');
  const [isSomeoneSpeaking, setIsSomeoneSpeaking] = useState(false);
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
    } else if (!isListening && status !== 'stopped') {
      smartTranscription.stopListening();
    }
  }, [isListening, status]);

  // Simulate speech detection and transcription
  useEffect(() => {
    if (!isListening) return;

    const speechPhrases = [
      "Hi everyone, welcome to our demo",
      "The background noise here is really challenging",
      "Our audio bubble technology helps filter it out",
      "Real-time transcription is working perfectly",
      "Let me explain the problem we identified",
      "Can everyone hear me clearly?",
      "This is much better than shouting",
      "The captions are really helpful"
    ];

    let phraseIndex = 0;
    let speechActive = false;

    const speechSimulation = setInterval(() => {
      // Simulate someone starting to speak
      if (!speechActive && Math.random() < 0.3) {
        speechActive = true;
        setIsSomeoneSpeaking(true);
        const speakers = ['Alex Chen', 'Sarah Kim', 'You', 'Jordan Lee'];
        const currentSpeaker = speakers[Math.floor(Math.random() * speakers.length)];
        setCurrentSpeaker(currentSpeaker);

        // Simulate speaking duration (2-5 seconds)
        const speakDuration = 2000 + Math.random() * 3000;
        
        setTimeout(() => {
          // Add transcribed text
          const newTranscript: TranscriptionEntry = {
            id: Date.now().toString(),
            speaker: currentSpeaker,
            text: speechPhrases[phraseIndex % speechPhrases.length],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            confidence: 0.85 + Math.random() * 0.1
          };
          
          setTranscripts(prev => [...prev, newTranscript]);
          speechActive = false;
          setIsSomeoneSpeaking(false);
          setCurrentSpeaker('');
          phraseIndex++;
        }, 1500); // Wait 1.5 seconds before adding transcript
      }
    }, 1500);

    return () => clearInterval(speechSimulation);
  }, [isListening]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

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
          <div className={`w-3 h-3 rounded-full ${
            isSomeoneSpeaking ? 'bg-green-500 animate-pulse' : 
            isListening ? 'bg-red-500' : 'bg-gray-400'
          }`} />
          <span className="font-medium">
            {isSomeoneSpeaking ? `${currentSpeaker} speaking...` : 
             isListening ? 'Live Captions' : 'Stopped'}
          </span>
          {isSomeoneSpeaking && (
            <Mic className="h-3 w-3 text-green-600 animate-pulse" />
          )}
        </div>
        
        <div className="flex space-x-2">
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
          {transcripts.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center space-y-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mx-auto" />
                <p>Listening for speech...</p>
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
              
              {/* Typing indicator */}
              {isListening && (
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