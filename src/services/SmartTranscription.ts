interface TranscriptionEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  confidence: number;
  source: 'web-speech' | 'gemini' | 'hybrid';
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
}

export class SmartTranscriptionService {
  private recognition: SpeechRecognition | null = null;
  private isActive = false;
  private transcriptBuffer: string[] = [];
  private bufferTimeout: NodeJS.Timeout | null = null;
  private callbacks: {
    onTranscription?: (entry: TranscriptionEntry) => void;
    onError?: (error: string) => void;
    onStatusChange?: (status: 'started' | 'stopped' | 'listening') => void;
  } = {};

  private readonly API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyACGo42GGYMUn14tmcuzWzaJmjUN9VYfQE';
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    this.initializeWebSpeech();
  }

  private initializeWebSpeech(): void {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupRecognitionProperties();
        this.setupRecognitionCallbacks();
      } else {
        console.warn('⚠️ Web Speech API not supported in this browser');
      }
    }
  }

  private setupRecognitionProperties(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
    
    // Enhanced configuration for better accuracy
    (this.recognition as any).grammars = [];
    (this.recognition as any).serviceURI = '';
  }

  private setupRecognitionCallbacks(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      console.log('🎤 Web Speech API started');
      this.callbacks.onStatusChange?.('listening');
    };

    this.recognition.onresult = async (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          await this.processTranscript(transcript, confidence, 'web-speech', true);
        } else {
          interimTranscript += transcript;
          await this.processTranscript(transcript, confidence, 'web-speech', false);
        }
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Web Speech API error:', event.error);
      this.callbacks.onError?.(`Speech recognition error: ${event.error}`);
    };

    this.recognition.onend = () => {
      console.log('🎤 Web Speech API ended');
      if (this.isActive) {
        // Automatically restart if still active
        setTimeout(() => {
          this.recognition?.start();
        }, 100);
      }
    };
  }

  private async processTranscript(
    transcript: string, 
    confidence: number, 
    source: 'web-speech' | 'gemini' | 'hybrid',
    isFinal: boolean
  ): Promise<void> {
    if (!transcript.trim()) return;

    const entry: TranscriptionEntry = {
      id: `transcript-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      speaker: 'Speaker',
      text: transcript.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: 'numeric', 
        minute: '2-digit' 
      }),
      confidence,
      source
    };

    if (isFinal) {
      // For final transcriptions, enhance with Gemini AI
      await this.enhanceWithGemini(entry);
    }

    this.callbacks.onTranscription?.(entry);
  }

  private async enhanceWithGemini(entry: TranscriptionEntry): Promise<void> {
    try {
      // Buffer transcript chunks for Gemini processing
      this.transcriptBuffer.push(entry.text);
      
      // Clear previous timeout
      if (this.bufferTimeout) {
        clearTimeout(this.bufferTimeout);
      }

      // Wait for more chunks or timeout
      this.bufferTimeout = setTimeout(async () => {
        if (this.transcriptBuffer.length === 0) return;

        const combinedText = this.transcriptBuffer.join(' ');
        const enhancedText = await this.callGeminiAPI(combinedText);
        
        if (enhancedText && enhancedText !== combinedText) {
          const enhancedEntry: TranscriptionEntry = {
            ...entry,
            id: `gemini-enhanced-${Date.now()}`,
            text: enhancedText,
            confidence: Math.min(entry.confidence + 0.1, 1.0),
            source: 'hybrid'
          };
          
          this.callbacks.onTranscription?.(enhancedEntry);
        }
        
        this.transcriptBuffer = [];
      }, 2000); // Process after 2 seconds of silence

    } catch (error) {
      console.error('❌ Gemini enhancement failed:', error);
    }
  }

  private async callGeminiAPI(text: string): Promise<string | null> {
    try {
      const prompt = `
Please enhance and correct this speech transcription for better clarity and accuracy:

"${text}"

Requirements:
1. Fix any grammatical errors
2. Correct typos and misheard words
3. Improve sentence structure
4. Maintain the original meaning and speaker's intent
5. Keep it conversational and natural
6. Return only the corrected text, no explanations

Enhanced transcription:`;

      const response = await fetch(`${this.GEMINI_API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3, // Low temperature for consistent corrections
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        const enhancedText = data.candidates[0].content.parts[0].text;
        console.log('🤖 Gemini enhanced transcription:', enhancedText);
        return enhancedText.trim();
      }
      
      return null;
    } catch (error) {
      console.error('❌ Gemini API call failed:', error);
      return null;
    }
  }

  public startListening(): void {
    if (!this.recognition) {
      this.callbacks.onError?.('Speech recognition not supported');
      return;
    }

    if (!this.isActive) {
      console.log('🚀 Starting smart transcription service');
      this.isActive = true;
      this.callbacks.onStatusChange?.('started');
      this.recognition.start();
    }
  }

  public stopListening(): void {
    if (this.isActive) {
      console.log('🛑 Stopping smart transcription service');
      this.isActive = false;
      this.recognition?.stop();
      this.callbacks.onStatusChange?.('stopped');
      
      // Clear any pending Gemini requests
      this.transcriptBuffer = [];
      if (this.bufferTimeout) {
        clearTimeout(this.bufferTimeout);
        this.bufferTimeout = null;
      }
    }
  }

  public setCallbacks(callbacks: typeof this.callbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public destroy(): void {
    this.stopListening();
    this.recognition = null;
    this.callbacks = {};
  }
}

// Export singleton instance
export const smartTranscription = new SmartTranscriptionService();

// TypeScript definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
