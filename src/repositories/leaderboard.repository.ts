/**
 * Leaderboard Repository
 * Data access layer for leaderboard rankings and positions
 */

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Firestore,
} from "firebase/firestore";
import {
  Leaderboard,
  LeaderboardScope,
  LeaderboardMetric,
  LeaderboardEntry,
  UserLeaderboardPosition,
} from "@/domain/leaderboard/types";
import type { LeaderboardDoc, UserLeaderboardPositionDoc } from "@/domain/firestore.schema";

export class LeaderboardRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Create or update leaderboard
   */
  async createOrUpdate(
    scope: LeaderboardScope,
    metric: LeaderboardMetric,
    period: "weekly" | "monthly" | "alltime",
    rankings: LeaderboardEntry[],
    location?: { city?: string; country?: string; region?: string }
  ): Promise<Leaderboard> {
    try {
      const docRef = await addDoc(collection(this.db, "leaderboards"), {
        scope,
        location,
        metric,
        period,
        rankings,
        generatedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      } as LeaderboardDoc);

      return {
        id: docRef.id,
        scope,
        location,
        metric,
        period,
        rankings,
        generatedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
    } catch (error) {
      throw new Error(`Failed to create leaderboard: ${error}`);
    }
  }

  /**
   * Get leaderboard by scope and metric
   */
  async get(
    scope: LeaderboardScope,
    metric: LeaderboardMetric,
    period: "weekly" | "monthly" | "alltime" = "weekly"
  ): Promise<Leaderboard | null> {
    try {
      const constraints = [
        where("scope", "==", scope),
        where("metric", "==", metric),
        where("period", "==", period),
      ];

      const q = query(collection(this.db, "leaderboards"), ...constraints);
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const data = snapshot.docs[0].data() as LeaderboardDoc;
      return {
        id: snapshot.docs[0].id,
        ...data,
      };
    } catch (error) {
      throw new Error(`Failed to get leaderboard: ${error}`);
    }
  }

  /**
   * Get global leaderboard with limits
   */
  async getGlobal(
    metric: LeaderboardMetric,
    period: "weekly" | "monthly" | "alltime" = "weekly",
    limitSize: number = 100
  ): Promise<LeaderboardEntry[]> {
    try {
      const leaderboard = await this.get("global", metric, period);
      if (!leaderboard) return [];

      return leaderboard.rankings.slice(0, limitSize);
    } catch (error) {
      throw new Error(`Failed to get global leaderboard: ${error}`);
    }
  }

  /**
   * Get city leaderboard
   */
  async getByCity(
    city: string,
    metric: LeaderboardMetric,
    period: "weekly" | "monthly" | "alltime" = "weekly"
  ): Promise<LeaderboardEntry[]> {
    try {
      // Query leaderboards for this city
      const q = query(
        collection(this.db, "leaderboards"),
        where("scope", "==", "city"),
        where("metric", "==", metric),
        where("period", "==", period)
      );

      const snapshot = await getDocs(q);

      // Find matching city
      for (const doc of snapshot.docs) {
        const data = doc.data() as LeaderboardDoc;
        if (data.location?.city === city) {
          return data.rankings;
        }
      }

      return [];
    } catch (error) {
      throw new Error(`Failed to get city leaderboard: ${error}`);
    }
  }

  /**
   * Update user position on leaderboards
   */
  async updateUserPosition(
    userId: string,
    positions: UserLeaderboardPosition["positions"]
  ): Promise<void> {
    try {
      const docRef = doc(this.db, "user_leaderboard_positions", userId);
      await updateDoc(docRef, {
        positions,
        updatedAt: Date.now(),
      });
    } catch {
      // If document doesn't exist, create it
      try {
        await addDoc(collection(this.db, "user_leaderboard_positions"), {
          userId,
          positions,
          updatedAt: Date.now(),
        } as UserLeaderboardPositionDoc);
      } catch (createError) {
        throw new Error(`Failed to update user position: ${createError}`);
      }
    }
  }

  /**
   * Get user's positions on all leaderboards
   */
  async getUserPositions(userId: string): Promise<UserLeaderboardPosition | null> {
    try {
      const snapshot = await getDocs(
        query(collection(this.db, "user_leaderboard_positions"), where("userId", "==", userId))
      );

      if (snapshot.empty) return null;

      const data = snapshot.docs[0].data() as UserLeaderboardPositionDoc;
      return {
        userId: data.userId,
        positions: data.positions,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to get user positions: ${error}`);
    }
  }

  /**
   * Get user's rank and percentile for specific metric
   */
  async getUserStats(
    userId: string,
    scope: LeaderboardScope,
    metric: LeaderboardMetric,
    period: "weekly" | "monthly" | "alltime" = "weekly"
  ): Promise<{ rank: number; percentile: number; value: number } | null> {
    try {
      const leaderboard = await this.get(scope, metric, period);
      if (!leaderboard) return null;

      const entry = leaderboard.rankings.find((r) => r.userId === userId);
      if (!entry) return null;

      const percentile =
        ((leaderboard.rankings.length - entry.rank) / leaderboard.rankings.length) * 100;

      return {
        rank: entry.rank,
        percentile,
        value: entry.metric,
      };
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error}`);
    }
  }

  /**
   * Get top N users in leaderboard
   */
  async getTopUsers(
    scope: LeaderboardScope,
    metric: LeaderboardMetric,
    topN: number = 10,
    period: "weekly" | "monthly" | "alltime" = "weekly"
  ): Promise<LeaderboardEntry[]> {
    try {
      const leaderboard = await this.get(scope, metric, period);
      if (!leaderboard) return [];

      return leaderboard.rankings.slice(0, topN);
    } catch (error) {
      throw new Error(`Failed to get top users: ${error}`);
    }
  }

  /**
   * Delete expired leaderboards
   */
  async deleteExpired(): Promise<number> {
    try {
      const q = query(collection(this.db, "leaderboards"), where("expiresAt", "<", Date.now()));

      const snapshot = await getDocs(q);
      let deleted = 0;

      for (const doc of snapshot.docs) {
        await updateDoc(doc.ref, { deletedAt: Date.now() });
        deleted++;
      }

      return deleted;
    } catch (error) {
      throw new Error(`Failed to delete expired leaderboards: ${error}`);
    }
  }
}
