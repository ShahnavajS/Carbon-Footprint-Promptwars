/**
 * Voice Coach Repository
 * Handles CRUD operations for voice sessions and conversations
 */

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  query,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { VoiceSession, ConversationTurn } from "@/domain/voice/types";
import { VoiceSessionSchema, ConversationTurnSchema } from "@/domain/voice/schemas";
import { logger } from "@/services/logger.service";

export class VoiceRepository {
  private db = getFirestore();
  private collection_name = "voice-sessions";

  /**
   * Create new voice session
   */
  async createSession(userId: string, session: Omit<VoiceSession, "id">): Promise<string> {
    try {
      const validated = VoiceSessionSchema.omit({ id: true }).parse(session);

      const docRef = await addDoc(
        collection(this.db, "users", userId, this.collection_name),
        validated
      );

      logger.info("Voice session created", {
        userId,
        sessionId: docRef.id,
        turnCount: session.turnCount,
      });

      return docRef.id;
    } catch (error) {
      logger.error("Failed to create voice session", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get voice session by ID
   */
  async getSession(userId: string, sessionId: string): Promise<VoiceSession | null> {
    try {
      const docRef = doc(this.db, "users", userId, this.collection_name, sessionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const validated = VoiceSessionSchema.parse({ id: docSnap.id, ...data });
      return validated;
    } catch (error) {
      logger.error("Failed to get voice session", {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get recent voice sessions for user
   */
  async getSessions(userId: string, limit_count: number = 20): Promise<VoiceSession[]> {
    try {
      const querySnap = await getDocs(
        query(
          collection(this.db, "users", userId, this.collection_name),
          orderBy("startedAt", "desc"),
          limit(limit_count)
        )
      );

      const sessions: VoiceSession[] = [];
      for (const docSnap of querySnap.docs) {
        try {
          const data = docSnap.data();
          const validated = VoiceSessionSchema.parse({ id: docSnap.id, ...data });
          sessions.push(validated);
        } catch (error) {
          logger.warn("Invalid voice session document", {
            userId,
            docId: docSnap.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return sessions;
    } catch (error) {
      logger.error("Failed to get voice sessions", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Add turn to session
   */
  async addTurn(userId: string, sessionId: string, turn: ConversationTurn): Promise<void> {
    try {
      const validated = ConversationTurnSchema.parse(turn);

      const docRef = doc(this.db, "users", userId, this.collection_name, sessionId);
      const session = await this.getSession(userId, sessionId);

      if (!session) {
        throw new Error("Voice session not found");
      }

      const turns = [...session.turns, validated];

      await updateDoc(docRef, {
        turns,
        turnCount: turns.length,
        extractedTips: [...session.extractedTips, ...turn.extracted.tips],
        extractedRecommendations: [
          ...session.extractedRecommendations,
          ...turn.extracted.recommendations,
        ],
      });

      logger.info("Voice turn added", {
        userId,
        sessionId,
        turnCount: turns.length,
      });
    } catch (error) {
      logger.error("Failed to add voice turn", {
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
  async endSession(userId: string, sessionId: string, summary?: string): Promise<void> {
    try {
      const docRef = doc(this.db, "users", userId, this.collection_name, sessionId);
      const session = await this.getSession(userId, sessionId);

      if (!session) {
        throw new Error("Voice session not found");
      }

      const duration = Math.floor((Date.now() - session.startedAt) / 1000);

      await updateDoc(docRef, {
        endedAt: Date.now(),
        duration,
        summary: summary || undefined,
      });

      logger.info("Voice session ended", {
        userId,
        sessionId,
        duration,
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
   * Search sessions by topic
   */
  async searchSessions(
    userId: string,
    topic: string,
    limit_count: number = 10
  ): Promise<VoiceSession[]> {
    try {
      const sessions = await this.getSessions(userId, limit_count * 2);

      return sessions
        .filter((session) =>
          session.topicsCovered.some((t) => t.toLowerCase().includes(topic.toLowerCase()))
        )
        .slice(0, limit_count);
    } catch (error) {
      logger.error("Failed to search voice sessions", {
        userId,
        topic,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}

export const voiceRepository = new VoiceRepository();
