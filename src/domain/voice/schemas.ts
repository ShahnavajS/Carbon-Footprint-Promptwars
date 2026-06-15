/**
 * Voice Coach Validation Schemas
 * Using Zod for runtime validation
 */

import { z } from "zod";

// ─── Conversation Turn Schema ──────────────────────────────────────────────

export const ConversationTurnSchema = z.object({
  id: z.string().min(1),
  timestamp: z.number().positive(),

  userQuery: z.string().min(1).max(1000),
  userQueryTranscript: z.string().max(1000).optional(),

  geminiResponse: z.string().min(1).max(2000),
  responseType: z.enum(["answer", "suggestion", "encouragement", "recommendation"]),

  audioUrl: z.string().url().optional(),
  audioDuration: z.number().min(0).max(300).optional(),

  extracted: z.object({
    tips: z.array(z.string()).max(5),
    recommendations: z.array(z.string()).max(5),
    actionItems: z.array(z.string()).max(5),
  }),
});

// ─── Voice Session Schema ──────────────────────────────────────────────────

export const VoiceSessionSchema = z.object({
  id: z.string().min(1),
  uid: z.string().min(1),

  startedAt: z.number().positive(),
  endedAt: z.number().positive().optional(),

  turns: z.array(ConversationTurnSchema),

  duration: z.number().min(0).optional(),
  turnCount: z.number().min(0),

  summary: z.string().max(1000).optional(),
  topicsCovered: z.array(z.string()).max(10),
  extractedTips: z.array(z.string()).max(20),
  extractedRecommendations: z.array(z.string()).max(20),

  userLevel: z.string(),
  userEcoScore: z.number().min(0),
  userCurrentFocus: z.string().optional(),
});

// ─── Voice Command Schema ──────────────────────────────────────────────────

export const VoiceCommandSchema = z.object({
  transcript: z.string().min(1).max(1000),
  confidence: z.number().min(0).max(1),
  isFinal: z.boolean(),
  language: z.string(),
  timestamp: z.number().positive(),
});

// ─── Voice Response Schema ──────────────────────────────────────────────────

export const VoiceResponseSchema = z.object({
  transcript: z.string().min(1).max(1000),
  response: z.string().min(1).max(2000),
  audioUrl: z.string().url().optional(),

  extracted: z.object({
    tips: z.array(z.string()).max(5),
    recommendations: z.array(z.string()).max(5),
    actionItems: z.array(z.string()).max(5),
  }),

  suggestedFollowUp: z.string().max(500).optional(),
});

// ─── Voice Settings Schema ────────────────────────────────────────────────

export const VoiceCoachSettingsSchema = z.object({
  enabled: z.boolean(),
  voiceLanguage: z.enum(["en", "es", "fr", "de", "zh"]),
  synthesisVoice: z.enum(["male", "female"]),
  playAudio: z.boolean(),
  saveTranscripts: z.boolean(),
  feedbackLevel: z.enum(["none", "minimal", "detailed"]),
});

// ─── Voice Stats Schema ────────────────────────────────────────────────────

export const VoiceCoachStatsSchema = z.object({
  totalSessions: z.number().min(0),
  totalTurns: z.number().min(0),
  totalDuration: z.number().min(0),
  averageSessionDuration: z.number().min(0),
  commonTopics: z.array(z.string()).max(10),
  frequentQuestions: z.array(z.string()).max(10),
  lastSessionAt: z.number().positive().optional(),
  preferredTimes: z.array(z.string()).max(24),
});

// ─── Voice Feedback Schema ────────────────────────────────────────────────

export const VoiceFeedbackSchema = z.object({
  turnId: z.string().min(1),
  sessionId: z.string().min(1),
  rating: z.enum(["1", "2", "3", "4", "5"]),
  helpful: z.boolean(),
  relevance: z.enum(["highly_relevant", "relevant", "somewhat_relevant", "not_relevant"]),
  comment: z.string().max(500).optional(),
  createdAt: z.number().positive(),
});

export type VoiceSession = z.infer<typeof VoiceSessionSchema>;
export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;
export type VoiceResponse = z.infer<typeof VoiceResponseSchema>;
