import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface TranscriptionHookReturn {
  isTranscribing: boolean;
  finalTranscripts: string[];
  interimTranscript: string;
  startTranscription: () => void;
  stopTranscription: () => void;
  clearTranscripts: () => void;
}

export function useTranscription(): TranscriptionHookReturn {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [finalTranscripts, setFinalTranscripts] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const finalResultsRef = useRef<string[]>([]);

  // Test Web Speech API availability
  const testWebSpeechAPI = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Web Speech API not supported in this browser');
      return false;
    }
    
    console.log('Web Speech API is supported');
    return true;
  }, []);

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Web Speech API not supported');
      return null;
    }

    const recognition = new SpeechRecognition();
    
    // Configuration
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // Event handlers
    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsTranscribing(true);
      setInterimTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          // Final result - add to transcript list
          const finalTranscript = transcript.trim();
          if (finalTranscript) {
            finalResultsRef.current = [...finalResultsRef.current, finalTranscript];
            setFinalTranscripts([...finalResultsRef.current]);
            setInterimTranscript('');
          }
        } else {
          // Interim result - show as you speak
          interim += transcript;
          setInterimTranscript(interim.trim());
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsTranscribing(false);
      
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable audio permissions.');
      } else if (event.error === 'no-speech') {
        toast.warning('No speech detected. Try speaking louder.');
      } else if (event.error === 'audio-capture') {
        toast.error('Microphone not found or in use by another application.');
      } else if (event.error === 'network') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsTranscribing(false);
      setInterimTranscript('');
    };

    return recognition;
  }, []);

  const startTranscription = useCallback(() => {
    if (!testWebSpeechAPI()) {
      return;
    }

    if (isTranscribing) {
      console.log('Already transcribing');
      return;
    }

    const recognition = initializeRecognition();
    if (!recognition) {
      return;
    }

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      toast.success('Speech recognition started');
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast.error('Failed to start transcription');
    }
  }, [isTranscribing, testWebSpeechAPI, initializeRecognition]);

  const stopTranscription = useCallback(() => {
    if (!recognitionRef.current || !isTranscribing) {
      return;
    }

    try {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsTranscribing(false);
      setInterimTranscript('');
      toast.success('Speech recognition stopped');
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }, [isTranscribing]);

  const clearTranscripts = useCallback(() => {
    setFinalTranscripts([]);
    finalResultsRef.current = [];
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Quick test function
  const quickSpeechTest = useCallback(async () => {
    if (!testWebSpeechAPI()) {
      return false;
    }

    try {
      const recognition = initializeRecognition();
      if (!recognition) {
        return false;
      }

      recognition.continuous = false;
      recognition.maxAlternatives = 1;
      
      return new Promise((resolve) => {
        recognition.onstart = () => {
          console.log('Quick test started');
          setTimeout(() => {
            recognition.stop();
          }, 2000);
        };

        recognition.onresult = () => {
          console.log('Quick test successful');
          resolve(true);
        };

        recognition.onerror = () => {
          console.log('Quick test failed');
          resolve(false);
        };

        recognition.onend = () => {
          resolve(false);
        };

        try {
          recognition.start();
        } catch (error) {
          console.error('Quick test start error:', error);
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Quick test error:', error);
      return false;
    }
  }, [testWebSpeechAPI, initializeRecognition]);

  return {
    isTranscribing,
    finalTranscripts,
    interimTranscript,
    startTranscription,
    stopTranscription,
    clearTranscripts
  };
}
