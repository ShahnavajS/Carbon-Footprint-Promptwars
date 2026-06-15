/**
 * Voice Coach Domain
 *
 * Enables conversational AI coaching via natural language.
 * Supports voice input/output and conversation history.
 */

export interface ConversationTurn {
  id: string;
  timestamp: number; // Timestamp

  // User input
  userQuery: string;
  userQueryTranscript?: string; // Speech-to-text transcript

  // Gemini response
  geminiResponse: string;
  responseType: "answer" | "suggestion" | "encouragement" | "recommendation";

  // Audio metadata
  audioUrl?: string; // Synthesized response audio
  audioDuration?: number; // Seconds

  // Extracted insights
  extracted: {
    tips: string[];
    recommendations: string[];
    actionItems: string[];
  };
}

export interface VoiceSession {
  id: string;
  uid: string;

  startedAt: number; // Timestamp
  endedAt?: number;

  // Conversation turns
  turns: ConversationTurn[];

  // Session metadata
  duration?: number; // Seconds
  turnCount: number;

  // Summary
  summary?: string;
  topicsCovered: string[];
  extractedTips: string[];
  extractedRecommendations: string[];

  // Session context
  userLevel: string;
  userEcoScore: number;
  userCurrentFocus?: string;
}

/**
 * Voice Command
 * Structured representation of voice input
 */
export interface VoiceCommand {
  transcript: string;
  confidence: number; // 0-1 (Web Speech API confidence)
  isFinal: boolean;
  language: string;
  timestamp: number;
}

/**
 * Voice Response
 * Returned from voice processing endpoint
 */
export interface VoiceResponse {
  transcript: string; // Original user input
  response: string; // Gemini response
  audioUrl?: string; // Synthesized audio

  extracted: {
    tips: string[];
    recommendations: string[];
    actionItems: string[];
  };

  suggestedFollowUp?: string;
}

/**
 * Voice Settings
 * User preferences for voice coach
 */
export interface VoiceCoachSettings {
  enabled: boolean;
  voiceLanguage: "en" | "es" | "fr" | "de" | "zh";
  synthesisVoice: "male" | "female";
  playAudio: boolean;
  saveTranscripts: boolean;
  feedbackLevel: "none" | "minimal" | "detailed";
}

/**
 * Voice Stats
 * Aggregate metrics from voice sessions
 */
export interface VoiceCoachStats {
  totalSessions: number;
  totalTurns: number;
  totalDuration: number; // Seconds
  averageSessionDuration: number;
  commonTopics: string[];
  frequentQuestions: string[];
  lastSessionAt?: number;
  preferredTimes: string[]; // e.g., "morning", "evening"
}

/**
 * Voice Feedback
 * User rating of voice coach response
 */
export interface VoiceFeedback {
  turnId: string;
  sessionId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  helpful: boolean;
  relevance: "highly_relevant" | "relevant" | "somewhat_relevant" | "not_relevant";
  comment?: string;
  createdAt: number;
}
