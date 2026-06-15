/**
 * Leaderboard Service
 * Business logic for leaderboard generation and rankings
 */

import { Firestore } from "firebase/firestore";
import { LeaderboardRepository } from "@/repositories/leaderboard.repository";
import { LeaderboardScope, LeaderboardMetric, LeaderboardEntry } from "@/domain/leaderboard/types";

export class LeaderboardService {
  private leaderboardRepo: LeaderboardRepository;

  constructor(db: Firestore) {
    this.leaderboardRepo = new LeaderboardRepository(db);
  }

  /**
   * Get global leaderboard
   */
  async getGlobalLeaderboard(
    metric: LeaderboardMetric = "eco_score",
    period: "weekly" | "monthly" | "alltime" = "weekly",
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    try {
      const existing = await this.leaderboardRepo.get("global", metric, period);
      if (existing) {
        return existing.rankings.slice(0, limit);
      }
      return [];
    } catch (error) {
      throw new Error(`Failed to get global leaderboard: ${error}`);
    }
  }

  /**
   * Get city leaderboard
   */
  async getCityLeaderboard(
    city: string,
    metric: LeaderboardMetric = "eco_score",
    period: "weekly" | "monthly" | "alltime" = "weekly"
  ): Promise<LeaderboardEntry[]> {
    try {
      return await this.leaderboardRepo.getByCity(city, metric, period);
    } catch (error) {
      throw new Error(`Failed to get city leaderboard: ${error}`);
    }
  }

  /**
   * Get user's rank on specific leaderboard
   */
  async getUserRank(
    userId: string,
    scope: LeaderboardScope,
    metric: LeaderboardMetric,
    period: "weekly" | "monthly" | "alltime" = "weekly"
  ): Promise<{ rank: number; percentile: number; value: number } | null> {
    try {
      return await this.leaderboardRepo.getUserStats(userId, scope, metric, period);
    } catch (error) {
      throw new Error(`Failed to get user rank: ${error}`);
    }
  }

  /**
   * Generate leaderboard (called from Cloud Function)
   */
  async generateLeaderboard(
    scope: LeaderboardScope,
    metric: LeaderboardMetric,
    period: "weekly" | "monthly" | "alltime",
    rankings: LeaderboardEntry[],
    location?: { city?: string; country?: string; region?: string }
  ): Promise<void> {
    try {
      await this.leaderboardRepo.createOrUpdate(scope, metric, period, rankings, location);
    } catch (error) {
      throw new Error(`Failed to generate leaderboard: ${error}`);
    }
  }

  /**
   * Get top users on leaderboard
   */
  async getTopUsers(
    scope: LeaderboardScope,
    metric: LeaderboardMetric,
    topN: number = 10,
    period: "weekly" | "monthly" | "alltime" = "weekly"
  ): Promise<LeaderboardEntry[]> {
    try {
      return await this.leaderboardRepo.getTopUsers(scope, metric, topN, period);
    } catch (error) {
      throw new Error(`Failed to get top users: ${error}`);
    }
  }

  /**
   * Check for rank changes and trigger notifications
   */
  async checkRankChanges(
    userId: string
  ): Promise<{ movedUp: boolean; newRank: number; oldRank: number } | null> {
    try {
      const positions = await this.leaderboardRepo.getUserPositions(userId);
      if (!positions) return null;

      // Check against stored previous rank
      // This is simplified - full implementation would track previous ranks
      return null;
    } catch (error) {
      throw new Error(`Failed to check rank changes: ${error}`);
    }
  }

  /**
   * Get friend leaderboard (users in circles)
   */
  async getFriendsLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
    try {
      void userId;
      // Would need friend list from UserService
      // For now, return empty
      return [];
    } catch (error) {
      throw new Error(`Failed to get friends leaderboard: ${error}`);
    }
  }

  /**
   * Update user position on all leaderboards
   */
  async updateUserPosition(userId: string, ecoScore: number, streak: number): Promise<void> {
    try {
      await this.leaderboardRepo.updateUserPosition(userId, {
        global: {
          eco_score: {
            rank: 0, // Would be calculated
            value: ecoScore,
            percentile: 0, // Would be calculated
          },
          streak: {
            rank: 0,
            value: streak,
            percentile: 0,
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to update user position: ${error}`);
    }
  }

  /**
   * Clean up expired leaderboards
   */
  async cleanupExpired(): Promise<number> {
    try {
      return await this.leaderboardRepo.deleteExpired();
    } catch (error) {
      throw new Error(`Failed to cleanup expired leaderboards: ${error}`);
    }
  }
}
