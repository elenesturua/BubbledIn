import { useState, useEffect, useRef } from 'react';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Test Web Speech API availability
export const testWebSpeechAPI = (): { supported: boolean; error?: string } => {
  if (typeof window === 'undefined') {
    return { supported: false, error: 'Window not available' };
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    return { supported: false, error: 'Web Speech API not supported in this browser' };
  }

  try {
    const recognition = new SpeechRecognition();
    return { supported: true };
  } catch (error) {
    return { supported: false, error: 'Failed to create SpeechRecognition instance' };
  }
};

// Quick test function to verify microphone and speech recognition
export const quickSpeechTest = async (): Promise<{ mic: boolean; speech: boolean; error?: string }> => {
  try {
    // Test microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    
    // Test speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return { mic: true, speech: false, error: 'Speech recognition not supported' };
    }

    return { mic: true, speech: true };
  } catch (error) {
    return { mic: false, speech: false, error: error.message };
  }
};

export interface TranscriptionEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  confidence: number;
  isFinal: boolean;
}

interface UseTranscriptionOptions {
  enabled?: boolean;
  language?: string;
  continuous?: boolean;
}

export function useTranscription(
  stream: MediaStream | null, 
  userId: string,
  options: UseTranscriptionOptions = {}
) {
  const {
    enabled = true,
    language = 'en-US',
    continuous = true
  } = options;

  const [transcripts, setTranscripts] = useState<TranscriptionEntry[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [currentInterim, setCurrentInterim] = useState('');
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!stream || !enabled) return;

    // Check browser support
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported in this browser');
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    
    // Configuration
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    // Event: Recognition starts
    recognition.onstart = () => {
      console.log('[Transcription] Started listening');
      setIsListening(true);
    };

    // Event: Recognition results
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
          
          // Add final transcript to history
          const entry: TranscriptionEntry = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            speaker: 'You',
            text: transcript.trim(),
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            confidence: result[0].confidence || 0,
            isFinal: true,
          };

          setTranscripts(prev => [...prev, entry]);
          setCurrentInterim('');
        } else {
          interimTranscript += transcript;
        }
      }

      // Update interim results
      if (interimTranscript) {
        setCurrentInterim(interimTranscript);
      }
    };

    // Event: Recognition ends
    recognition.onend = () => {
      console.log('[Transcription] Stopped listening');
      setIsListening(false);

      // Auto-restart if stream is still active
      if (stream.active && enabled) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            console.error('[Transcription] Restart error:', error);
          }
        }, 100);
      }
    };

    // Event: Recognition error
    recognition.onerror = (event: any) => {
      console.error('[Transcription] Error:', event.error);
      
      // Handle specific errors
      if (event.error === 'no-speech') {
        console.log('[Transcription] No speech detected, restarting...');
      } else if (event.error === 'audio-capture') {
        console.error('[Transcription] No microphone detected');
        alert('No microphone detected. Please check your audio settings.');
      } else if (event.error === 'not-allowed') {
        console.error('[Transcription] Microphone permission denied');
        alert('Microphone permission denied. Please allow microphone access.');
      }
      
      setIsListening(false);
    };

    // Start recognition
    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error('[Transcription] Start error:', error);
    }

    // Cleanup
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [stream, enabled, language, continuous, userId]);

  // Manual control functions
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('[Transcription] Manual start error:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const clearTranscripts = () => {
    setTranscripts([]);
    setCurrentInterim('');
  };

  return {
    transcripts,
    currentInterim,
    isListening,
    startListening,
    stopListening,
    clearTranscripts,
  };
}