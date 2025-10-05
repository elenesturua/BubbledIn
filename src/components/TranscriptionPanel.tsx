import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, Share2, Mic, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { transcriptionService, TranscriptionEntry } from '../services/transcriptionService';
import { summaryService, RoomSummary } from '../services/summaryService';

interface TranscriptionPanelProps {
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  stream: MediaStream | null;
  isTranscribing?: boolean;
  isMuted?: boolean;
  isPushToTalk?: boolean;
  isPushToTalkPressed?: boolean;
}

export function TranscriptionPanel({ 
  roomId, 
  roomName, 
  userId, 
  userName, 
  stream, 
  isTranscribing: externalIsTranscribing,
  isMuted = false,
  isPushToTalk = false,
  isPushToTalkPressed = false
}: TranscriptionPanelProps) {
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [currentSpeakers, setCurrentSpeakers] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<RoomSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Use external transcription state
  const isTranscribing = externalIsTranscribing || false;

  // Listen to transcriptions from all participants (real-time sync)
  useEffect(() => {
    const unsubscribe = transcriptionService.onTranscriptions(roomId, (newTranscriptions) => {
      setTranscriptions(newTranscriptions);

      // Update current speakers (show who's speaking in real-time)
      const recentTranscriptions = newTranscriptions.slice(-3);
      const speakers = new Set(
        recentTranscriptions
          .filter(t => !t.isFinal && t.text) // Interim results indicate active speech
          .map(t => t.userName)
      );
      setCurrentSpeakers(speakers);
    });

    return () => unsubscribe();
  }, [roomId]);

  // Load existing summary if available
  useEffect(() => {
    const loadSummary = async () => {
      try {
        const existingSummary = await summaryService.getSummary(roomId);
        if (existingSummary) {
          setSummary(existingSummary);
        }
      } catch (error) {
        console.error('Failed to load summary:', error);
      }
    };

    loadSummary();
  }, [roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions]);

  const generateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const newSummary = await summaryService.generateSummary(roomId, roomName);
      setSummary(newSummary);
      toast.success('✨ AI summary generated!');
    } catch (error) {
      console.error('Failed to generate summary:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const shareTranscript = async () => {
    const finalTranscriptions = transcriptions.filter(t => t.isFinal);
    
    let content = finalTranscriptions
      .map(t => `[${t.timestamp?.toDate ? new Date(t.timestamp.toDate()).toLocaleTimeString() : 'N/A'}] ${t.userName}: ${t.text}`)
      .join('\n\n');
    
    if (summary) {
      content += `\n\n📝 AI SUMMARY:\n${summary.summary}`;
      content += `\n\n🎯 KEY POINTS:\n${summary.keyPoints.map(p => `• ${p}`).join('\n')}`;
      if (summary.actionItems.length > 0) {
        content += `\n\n✅ ACTION ITEMS:\n${summary.actionItems.map(a => `• ${a}`).join('\n')}`;
      }
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${roomName} - Transcript`,
          text: content
        });
        toast.success('Transcript shared!');
      } catch (error) {
        // User cancelled or sharing not supported
        await navigator.clipboard.writeText(content);
        toast.success('Transcript copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(content);
      toast.success('Transcript copied to clipboard!');
    }
  };

  const downloadTranscript = () => {
    const finalTranscriptions = transcriptions.filter(t => t.isFinal);
    
    let content = `${roomName} - Audio Bubble Transcript\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    content += finalTranscriptions
      .map(t => `[${t.timestamp?.toDate ? new Date(t.timestamp.toDate()).toLocaleTimeString() : 'N/A'}] ${t.userName}:\n${t.text}\n`)
      .join('\n');
    
    if (summary) {
      content += `\n\n${'='.repeat(50)}\n`;
      content += `📝 AI SUMMARY\n`;
      content += `${'='.repeat(50)}\n\n`;
      content += `${summary.summary}\n\n`;
      content += `🎯 KEY POINTS:\n${summary.keyPoints.map(p => `• ${p}`).join('\n')}\n\n`;
      if (summary.actionItems.length > 0) {
        content += `✅ ACTION ITEMS:\n${summary.actionItems.map(a => `• ${a}`).join('\n')}\n\n`;
      }
      content += `📊 STATISTICS:\n`;
      content += `• Participants: ${summary.participants.join(', ')}\n`;
      content += `• Total Messages: ${summary.totalMessages}\n`;
      content += `• Duration: ${summary.duration}\n`;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roomName.replace(/[^a-z0-9]/gi, '_')}-transcript-${Date.now()}.txt`;
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
      {/* Status & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            currentSpeakers.size > 0 ? 'bg-green-500 animate-pulse' : 
            isTranscribing 
              ? isPushToTalk
                ? 'bg-gray-500'
                : isMuted 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500' 
              : 'bg-gray-400'
          }`} />
          <span className="font-medium text-sm">
            {currentSpeakers.size > 0
              ? `${Array.from(currentSpeakers).join(', ')} speaking...`
              : isTranscribing
              ? isPushToTalk
                ? 'Live Captions Disabled (PTT)'
                : isMuted
                  ? 'Live Captions Muted'
                  : 'Live Captions Active'
              : 'Stopped'}
          </span>
          {currentSpeakers.size > 0 && (
            <Mic className="h-3 w-3 text-green-600 animate-pulse" />
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={generateSummary} 
            variant="outline" 
            size="sm"
            disabled={transcriptions.filter(t => t.isFinal).length === 0 || isGeneratingSummary}
            className="h-8 text-xs sm:text-sm"
            title="Generate AI summary of the conversation"
          >
            {isGeneratingSummary ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">Gen...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">AI Summary</span>
                <span className="sm:hidden">AI</span>
              </>
            )}
          </Button>
          <Button 
            onClick={shareTranscript} 
            variant="outline" 
            size="sm"
            disabled={transcriptions.filter(t => t.isFinal).length === 0}
            className="h-8 text-xs sm:text-sm"
            title="Share transcript"
          >
            <Share2 className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button 
            onClick={downloadTranscript} 
            variant="outline" 
            size="sm"
            disabled={transcriptions.filter(t => t.isFinal).length === 0}
            className="h-8 text-xs sm:text-sm"
            title="Download transcript as text file"
          >
            <Download className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>

      {/* AI Summary Card */}
      {summary && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-3 sm:p-4 border border-purple-200">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold text-purple-900 text-sm sm:text-base">AI Summary</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 mb-3 leading-relaxed">{summary.summary}</p>
          
          {summary.keyPoints.length > 0 && (
            <div className="space-y-1 mb-3">
              <p className="text-xs font-medium text-gray-600">🎯 Key Points:</p>
              {summary.keyPoints.map((point, idx) => (
                <p key={idx} className="text-xs text-gray-600 pl-2 break-words">• {point}</p>
              ))}
            </div>
          )}
          
          {summary.actionItems.length > 0 && (
            <div className="space-y-1 mb-3">
              <p className="text-xs font-medium text-gray-600">✅ Action Items:</p>
              {summary.actionItems.map((item, idx) => (
                <p key={idx} className="text-xs text-gray-600 pl-2 break-words">• {item}</p>
              ))}
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 text-xs text-gray-500 pt-2 border-t border-purple-200">
            <span>👥 {summary.participants.length} participant{summary.participants.length !== 1 ? 's' : ''}</span>
            <span>💬 {summary.totalMessages} message{summary.totalMessages !== 1 ? 's' : ''}</span>
            <span>⏱️ {summary.duration}</span>
          </div>
        </div>
      )}

      {/* Transcriptions Display */}
      <div className="flex-1 overflow-hidden">
        <div 
          className="max-h-80 sm:max-h-96 border rounded-2xl bg-gray-50 overflow-y-auto" 
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#9CA3AF #F3F4F6',
            maxHeight: '24rem'
          }}
          ref={scrollRef}
        >
          <div className="p-3 sm:p-4">
            {transcriptions.filter(t => t.isFinal).length === 0 ? (
              <div className="flex items-center justify-center h-24 sm:h-32 text-gray-500">
                <div className="text-center space-y-2 sm:space-y-3">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-pulse mx-auto" />
                  <p className="text-xs sm:text-sm">Listening for speech...</p>
                  <p className="text-xs">Start talking and your words will appear here</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {transcriptions.filter(t => t.isFinal).map((transcript) => (
                  <div key={transcript.id} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-medium text-xs sm:text-sm">{transcript.userName}</span>
                        {transcript.userId === userId && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">You</Badge>
                        )}
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getConfidenceColor(transcript.confidence)}`}
                        >
                          {Math.round(transcript.confidence * 100)}%
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {transcript.timestamp?.toDate 
                          ? new Date(transcript.timestamp.toDate()).toLocaleTimeString() 
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-white p-2 sm:p-3 rounded-xl border-l-4 border-blue-200 shadow-sm">
                      <p className="text-xs sm:text-sm leading-relaxed break-words">{transcript.text}</p>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTranscribing && currentSpeakers.size === 0 && (
                  <div className="flex items-center space-x-3 text-gray-500 py-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs sm:text-sm">Listening...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 sm:p-3 rounded-2xl space-y-1">
        <p className="hidden sm:block">🎙️ Real-time speech-to-text powered by Web Speech API (built into your browser)</p>
        <p className="sm:hidden">🎙️ Real-time speech-to-text</p>
        <p className="hidden sm:block">🤖 AI summaries by Gemini • 📊 Confidence scores show accuracy</p>
        <p className="sm:hidden">🤖 AI summaries • 📊 Confidence scores</p>
        <p className="hidden sm:block">💬 All participants see each other's transcriptions in real-time via Firestore</p>
        <p className="sm:hidden">💬 Real-time transcriptions for all participants</p>
      </div>
    </div>
  );
}