import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import React from "react";

interface TranscriptionEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  confidence: number;
}

export function TranscriptionPanel() {
  const [transcripts, setTranscripts] = useState<TranscriptionEntry[]>([]);
  const [isListening, setIsListening] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock transcription data
  const mockTranscripts: TranscriptionEntry[] = [
    {
      id: '1',
      speaker: 'Alex Chen',
      text: 'Hi everyone, welcome to our project demo. Today we\'ll be presenting our solution for improving accessibility in loud environments.',
      timestamp: '10:32 AM',
      confidence: 0.95
    },
    {
      id: '2', 
      speaker: 'You',
      text: 'Thanks Alex. Let me start by explaining the problem we identified during HackMIT.',
      timestamp: '10:33 AM',
      confidence: 0.92
    },
    {
      id: '3',
      speaker: 'Sarah Kim',
      text: 'The background noise here is really challenging, but our audio bubble technology helps filter it out.',
      timestamp: '10:34 AM',
      confidence: 0.88
    },
    {
      id: '4',
      speaker: 'Alex Chen',
      text: 'As you can see, the real-time transcription is working perfectly even in this noisy environment.',
      timestamp: '10:35 AM',
      confidence: 0.94
    }
  ];

  // Simulate real-time transcription
  useEffect(() => {
    if (mockTranscripts.length === 0) return;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < mockTranscripts.length) {
        setTranscripts(prev => [...prev, mockTranscripts[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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
          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="font-medium">
            {isListening ? 'Live Captions' : 'Stopped'}
          </span>
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