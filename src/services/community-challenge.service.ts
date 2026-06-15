/**
 * Community Challenge Service
 * Business logic for community challenges and participation
 */

import { Firestore } from "firebase/firestore";
import { CommunityChallengeRepository } from "@/repositories/community-challenge.repository";
import { CommunityChallenge, ChallengeParticipant } from "@/domain/challenge/types";

export class CommunityChallengeService {
  private challengeRepo: CommunityChallengeRepository;

  constructor(db: Firestore) {
    this.challengeRepo = new CommunityChallengeRepository(db);
  }

  /**
   * Get all active challenges
   */
  async getActiveChallenges(type?: string): Promise<CommunityChallenge[]> {
    try {
      return await this.challengeRepo.getActive(type);
    } catch (error) {
      throw new Error(`Failed to get active challenges: ${error}`);
    }
  }

  /**
   * Get challenge details
   */
  async getChallenge(challengeId: string): Promise<CommunityChallenge | null> {
    try {
      return await this.challengeRepo.getById(challengeId);
    } catch (error) {
      throw new Error(`Failed to get challenge: ${error}`);
    }
  }

  /**
   * Join a challenge
   */
  async joinChallenge(challengeId: string, userId: string): Promise<ChallengeParticipant> {
    try {
      return await this.challengeRepo.joinChallenge(challengeId, userId);
    } catch (error) {
      throw new Error(`Failed to join challenge: ${error}`);
    }
  }

  /**
   * Log activity for challenge
   */
  async logActivity(
    challengeId: string,
    userId: string,
    activityId: string,
    value: number
  ): Promise<void> {
    try {
      await this.challengeRepo.logEntry(challengeId, userId, activityId, value);
    } catch (error) {
      throw new Error(`Failed to log activity: ${error}`);
    }
  }

  /**
   * Get user's challenge participation
   */
  async getUserParticipation(
    challengeId: string,
    userId: string
  ): Promise<ChallengeParticipant | null> {
    try {
      return await this.challengeRepo.getUserParticipation(challengeId, userId);
    } catch (error) {
      throw new Error(`Failed to get user participation: ${error}`);
    }
  }

  /**
   * Get challenge leaderboard
   */
  async getLeaderboard(challengeId: string, limit: number = 100) {
    try {
      return await this.challengeRepo.getLeaderboard(challengeId, limit);
    } catch (error) {
      throw new Error(`Failed to get leaderboard: ${error}`);
    }
  }

  /**
   * Check if challenge is completed
   */
  async isChallengeCompleted(
    challengeId: string,
    userId: string,
    requiredProgress: number = 100
  ): Promise<boolean> {
    try {
      const participation = await this.getUserParticipation(challengeId, userId);
      if (!participation) return false;

      return participation.progress >= requiredProgress;
    } catch (error) {
      throw new Error(`Failed to check challenge completion: ${error}`);
    }
  }

  /**
   * Complete challenge for user
   */
  async completeChallenge(challengeId: string, userId: string): Promise<void> {
    try {
      await this.challengeRepo.completeChallenge(challengeId, userId);
    } catch (error) {
      throw new Error(`Failed to complete challenge: ${error}`);
    }
  }

  /**
   * Get suggested challenges for user
   */
  async getSuggestedChallenges(_userId: string, limit: number = 5): Promise<CommunityChallenge[]> {
    try {
      // Get all active challenges
      const active = await this.getActiveChallenges();

      // Sort by difficulty and randomize
      return active
        .filter((c) => c.status === "active")
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to get suggested challenges: ${error}`);
    }
  }

  /**
   * Create challenge (admin only)
   */
  async createChallenge(
    title: string,
    description: string,
    type: "food" | "transport" | "energy" | "general",
    difficulty: "easy" | "medium" | "hard",
    goal: string,
    startDate: number,
    endDate: number,
    createdBy: string
  ): Promise<CommunityChallenge> {
    try {
      return await this.challengeRepo.create({
        title,
        description,
        type,
        difficulty,
        status: "draft",
        goal,
        icon: this.getIconForType(type),
        color: this.getColorForType(type),
        startDate,
        endDate,
        participants: 0,
        createdAt: Date.now(),
        createdBy,
      });
    } catch (error) {
      throw new Error(`Failed to create challenge: ${error}`);
    }
  }

  /**
   * Get icon for challenge type
   */
  private getIconForType(type: string): string {
    const icons: Record<string, string> = {
      food: "🥗",
      transport: "🚌",
      energy: "💡",
      general: "🌍",
    };
    return icons[type] || "🌱";
  }

  /**
   * Get color for challenge type
   */
  private getColorForType(type: string): string {
    const colors: Record<string, string> = {
      food: "green",
      transport: "blue",
      energy: "amber",
      general: "emerald",
    };
    return colors[type] || "emerald";
  }
}
