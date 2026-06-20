/**
 * Voice Coach Service
 *
 * Enables conversational AI coaching via voice input/output
 * Uses Web Speech API for speech recognition and Gemini for responses
 */

import { VoiceSession, ConversationTurn, VoiceResponse } from "@/domain/voice/types";
import { voiceRepository } from "@/repositories/voice.repository";
import { userRepository } from "@/repositories/user.repository";
import { gemini } from "@/services/gemini";
import { logger } from "@/services/logger.service";
import { rateLimit } from "@/lib/rate-limiter";
import { getEcoTier } from "@/domain/eco-score/levels";

interface VoiceCoachGenerationResponse {
  response?: string;
  tips?: string[];
  recommendations?: string[];
  actionItems?: string[];
  suggestedFollowUp?: string;
}

export class VoiceCoachService {
  /**
   * Start new voice session
   */
  async startSession(userId: string): Promise<VoiceSession> {
    try {
      const user = await userRepository.getUser(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const session: Omit<VoiceSession, "id"> = {
        uid: userId,
        startedAt: Date.now(),
        turns: [],
        turnCount: 0,
        topicsCovered: [],
        extractedTips: [],
        extractedRecommendations: [],
        userLevel: this.calculateLevel(user.score.ecoScore),
        userEcoScore: user.score.ecoScore,
        userCurrentFocus: undefined,
      };

      const sessionId = await voiceRepository.createSession(userId, session);

      return {
        ...session,
        id: sessionId,
      };
    } catch (error) {
      logger.error("Failed to start voice session", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Process voice query and generate response
   */
  async processVoiceQuery(
    userId: string,
    sessionId: string,
    transcript: string
  ): Promise<VoiceResponse> {
    try {
      // Rate limiting
      await rateLimit("AI", userId);

      // Get session
      const session = await voiceRepository.getSession(userId, sessionId);
      if (!session) {
        throw new Error("Voice session not found");
      }

      // Get user for context
      const user = await userRepository.getUser(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Build prompt with context
      const prompt = this.buildVoicePrompt(user, session, transcript);

      // Call Gemini
      const response = (await gemini.generateJSON(prompt, {
        temperature: 0.8,
        maxTokens: 500,
      })) as VoiceCoachGenerationResponse;

      // Parse response
      const voiceResponse: VoiceResponse = {
        transcript,
        response: response.response || "",
        extracted: {
          tips: response.tips || [],
          recommendations: response.recommendations || [],
          actionItems: response.actionItems || [],
        },
        suggestedFollowUp: response.suggestedFollowUp,
      };

      // Synthesize speech (if in browser)
      if (typeof window !== "undefined") {
        voiceResponse.audioUrl = await this.synthesizeSpeech(voiceResponse.response);
      }

      // Add turn to session
      const turn: ConversationTurn = {
        id: `turn-${Date.now()}`,
        timestamp: Date.now(),
        userQuery: transcript,
        geminiResponse: voiceResponse.response,
        responseType: this.classifyResponseType(voiceResponse),
        audioUrl: voiceResponse.audioUrl,
        extracted: voiceResponse.extracted,
      };

      await voiceRepository.addTurn(userId, sessionId, turn);

      // Update session topics
      void [...session.topicsCovered, ...this.extractTopics(transcript)];
      // In production, would update topics in Firestore

      logger.info("Voice query processed", {
        userId,
        sessionId,
        turnCount: session.turnCount + 1,
      });

      return voiceResponse;
    } catch (error) {
      logger.error("Failed to process voice query", {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * End voice session
   */
  async endSession(userId: string, sessionId: string): Promise<void> {
    try {
      const session = await voiceRepository.getSession(userId, sessionId);
      if (!session) {
        throw new Error("Voice session not found");
      }

      // Generate summary
      const summary = this.generateSessionSummary(session);

      await voiceRepository.endSession(userId, sessionId, summary);

      logger.info("Voice session ended", {
        userId,
        sessionId,
        duration: Math.floor((Date.now() - session.startedAt) / 1000),
      });
    } catch (error) {
      logger.error("Failed to end voice session", {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get recent sessions
   */
  async getSessions(userId: string, limit: number = 10): Promise<VoiceSession[]> {
    try {
      return await voiceRepository.getSessions(userId, limit);
    } catch (error) {
      logger.error("Failed to get sessions", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Build Gemini prompt for voice query
   */
  private buildVoicePrompt(
    user: Awaited<ReturnType<typeof userRepository.getUser>>,
    session: VoiceSession,
    query: string
  ): string {
    if (!user) {
      throw new Error("User not found");
    }

    return `You are a friendly sustainability coach having a voice conversation. Answer the user's question helpfully.

User Context:
- Eco-Score: ${user.score.ecoScore}
- Level: ${session.userLevel}
- Previous Turns: ${session.turnCount}
${session.topicsCovered.length > 0 ? `- Topics Discussed: ${session.topicsCovered.join(", ")}` : ""}

User Question: "${query}"

Respond with JSON:
{
  "response": "string (friendly, conversational answer, 100-200 words)",
  "tips": ["string", ...],
  "recommendations": ["string", ...],
  "actionItems": ["string", ...],
  "suggestedFollowUp": "string (optional suggestion for next question)"
}

Be encouraging and actionable. Keep response conversational for voice delivery.`;
  }

  /**
   * Synthesize speech from text (client-side)
   */
  private async synthesizeSpeech(text: string): Promise<string | undefined> {
    try {
      if (typeof window === "undefined") {
        return undefined;
      }

      // Use Web Speech API or return undefined for client-side synthesis
      // In production, would call a TTS service or use browser's SpeechSynthesis API
      void text;
      return undefined;
    } catch (error) {
      logger.warn("Failed to synthesize speech", {
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  /**
   * Classify response type
   */
  private classifyResponseType(
    response: VoiceResponse
  ): "answer" | "suggestion" | "encouragement" | "recommendation" {
    const text = response.response.toLowerCase();

    if (response.extracted.recommendations.length > 0 || text.includes("try")) {
      return "recommendation";
    }
    if (response.extracted.actionItems.length > 0) {
      return "suggestion";
    }
    if (text.includes("great") || text.includes("awesome") || text.includes("well done")) {
      return "encouragement";
    }

    return "answer";
  }

  /**
   * Extract topics from user query
   */
  private extractTopics(query: string): string[] {
    const topics: string[] = [];
    const categoryKeywords = {
      food: ["food", "diet", "vegan", "meat", "shopping", "grocery"],
      transport: ["transport", "car", "bike", "public", "walk", "drive", "fuel"],
      energy: ["energy", "electricity", "solar", "renewable", "power", "heating"],
      other: ["habit", "lifestyle", "goal", "progress", "streak"],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => query.toLowerCase().includes(kw))) {
        topics.push(category);
      }
    }

    return topics;
  }

  /**
   * Generate session summary
   */
  private generateSessionSummary(session: VoiceSession): string {
    if (session.turns.length === 0) {
      return "Empty session";
    }

    const topicsText =
      session.topicsCovered.length > 0 ? `Discussed: ${session.topicsCovered.join(", ")}. ` : "";

    const tipsText =
      session.extractedTips.length > 0
        ? `Key tips: ${session.extractedTips.slice(0, 3).join(", ")}. `
        : "";

    const duration = Math.floor(
      (session.endedAt ? session.endedAt - session.startedAt : Date.now() - session.startedAt) /
        1000
    );

    return `${topicsText}${tipsText}Conversation lasted ${duration}s with ${session.turnCount} exchanges.`;
  }

  /**
   * Calculate level tier based on eco-score (delegates to the unified config).
   */
  private calculateLevel(ecoScore: number): string {
    return getEcoTier(ecoScore);
  }
}

export const voiceCoachService = new VoiceCoachService();
