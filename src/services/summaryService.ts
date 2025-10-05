/**
 * AI Summary Service using Gemini
 * Generates conversation summaries when room ends
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { TranscriptionEntry } from './transcriptionService';

export interface RoomSummary {
  roomId: string;
  roomName: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  participants: string[];
  duration: string;
  totalMessages: number;
  generatedAt: any;
}

class SummaryService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Gemini AI initialized');
    } else {
      console.warn('⚠️ Gemini API key not found. AI summaries will not be available.');
    }
  }

  /**
   * Generate summary using Gemini AI
   */
  async generateSummary(roomId: string, roomName: string): Promise<RoomSummary> {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    try {
      console.log('🤖 Generating AI summary for room:', roomId);

      // 1. Fetch all transcriptions
      const transcriptionsRef = collection(db, 'rooms', roomId, 'transcriptions');
      const snapshot = await getDocs(transcriptionsRef);
      
      const transcriptions = snapshot.docs.map(doc => doc.data()) as TranscriptionEntry[];
      
      if (transcriptions.length === 0) {
        throw new Error('No transcriptions found for this room. Make sure people have been speaking.');
      }

      // 2. Format conversation for Gemini
      const conversation = transcriptions
        .filter(t => t.isFinal) // Only include final transcriptions
        .map(t => `${t.userName}: ${t.text}`)
        .join('\n');

      // 3. Get unique participants
      const participants = [...new Set(transcriptions.map(t => t.userName))];

      // 4. Calculate duration
      const timestamps = transcriptions
        .map(t => t.timestamp?.toDate())
        .filter(t => t);
      
      const startTime = timestamps[0];
      const endTime = timestamps[timestamps.length - 1];
      const duration = this.calculateDuration(startTime, endTime);

      // 5. Call Gemini API for summary - Using Gemini 2.5 Pro (most advanced)
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      
      const prompt = `
Analyze this conversation from an audio conference room and provide a comprehensive summary.

Conversation:
${conversation}

Please analyze the conversation and provide:
1. A brief summary (2-3 sentences) of what was discussed
2. 3-5 key points or main topics discussed
3. Any action items, decisions, or next steps mentioned

Format your response as JSON with this exact structure:
{
  "summary": "brief summary here",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": ["action 1", "action 2"]
}

If there are no action items, use an empty array. Keep the summary concise and focus on the most important information.
`;

      console.log('📤 Sending prompt to Gemini...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('📥 Received response from Gemini');
      
      // Parse Gemini response
      const parsedResponse = this.parseGeminiResponse(text);

      // 6. Create summary object
      const summary: RoomSummary = {
        roomId,
        roomName,
        summary: parsedResponse.summary,
        keyPoints: parsedResponse.keyPoints,
        actionItems: parsedResponse.actionItems,
        participants,
        duration,
        totalMessages: transcriptions.filter(t => t.isFinal).length,
        generatedAt: new Date()
      };

      // 7. Save summary to Firestore
      await this.saveSummary(roomId, summary);

      console.log('✅ Summary generated and saved successfully');
      return summary;

    } catch (error) {
      console.error('❌ Failed to generate summary:', error);
      throw error;
    }
  }

  /**
   * Save summary to Firestore
   */
  private async saveSummary(roomId: string, summary: RoomSummary): Promise<void> {
    try {
      const summaryRef = doc(db, 'rooms', roomId, 'summary', 'final');
      await setDoc(summaryRef, summary);
      console.log('✅ Summary saved to Firestore');
    } catch (error) {
      console.error('❌ Failed to save summary:', error);
      throw error;
    }
  }

  /**
   * Get saved summary
   */
  async getSummary(roomId: string): Promise<RoomSummary | null> {
    try {
      const summaryRef = doc(db, 'rooms', roomId, 'summary', 'final');
      const summaryDoc = await getDoc(summaryRef);
      
      if (summaryDoc.exists()) {
        return summaryDoc.data() as RoomSummary;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get summary:', error);
      return null;
    }
  }

  /**
   * Parse Gemini JSON response
   */
  private parseGeminiResponse(text: string): { summary: string; keyPoints: string[]; actionItems: string[] } {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      
      // Remove ```json and ``` markers
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Try to parse as JSON
      const parsed = JSON.parse(cleanText);
      
      return {
        summary: parsed.summary || 'No summary available',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : []
      };
    } catch (error) {
      console.warn('⚠️ Failed to parse Gemini response as JSON, using fallback');
      console.log('Raw response:', text);
      
      // Fallback: treat the entire response as summary
      return {
        summary: text.substring(0, 500),
        keyPoints: ['Summary generation encountered formatting issues'],
        actionItems: []
      };
    }
  }

  /**
   * Calculate duration between two dates
   */
  private calculateDuration(start: Date, end: Date): string {
    if (!start || !end) return '0s';
    
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }
}

export const summaryService = new SummaryService();

