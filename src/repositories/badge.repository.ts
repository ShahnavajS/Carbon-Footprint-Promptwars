/**
 * Badges Repository
 * Data access layer for badge definitions and user badges
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
import { UserBadge, BadgeType } from "@/domain/badges/types";
import type { UserBadgeDoc, BadgeDefinitionDoc } from "@/domain/firestore.schema";

export class BadgeRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Get all badge definitions
   */
  async getAllDefinitions(): Promise<Map<BadgeType, BadgeDefinitionDoc>> {
    try {
      const snapshot = await getDocs(collection(this.db, "badges"));
      const badges = new Map<BadgeType, BadgeDefinitionDoc>();

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as BadgeDefinitionDoc;
        badges.set(data.id as BadgeType, data);
      });

      return badges;
    } catch (error) {
      throw new Error(`Failed to get badge definitions: ${error}`);
    }
  }

  /**
   * Get badge definition by ID
   */
  async getDefinition(badgeId: BadgeType): Promise<BadgeDefinitionDoc | null> {
    try {
      const snapshot = await getDocs(
        query(collection(this.db, "badges"), where("id", "==", badgeId))
      );

      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as BadgeDefinitionDoc;
    } catch (error) {
      throw new Error(`Failed to get badge definition: ${error}`);
    }
  }

  /**
   * Award badge to user
   */
  async awardBadge(userId: string, badgeId: BadgeType, progress: number = 100): Promise<UserBadge> {
    try {
      const docRef = await addDoc(collection(this.db, "user_badges"), {
        userId,
        badgeId,
        unlockedAt: Date.now(),
        progress,
        isNew: true,
        notificationSent: false,
      } as UserBadgeDoc);

      return {
        id: docRef.id,
        userId,
        badgeId,
        unlockedAt: Date.now(),
        progress,
        isNew: true,
      };
    } catch (error) {
      throw new Error(`Failed to award badge: ${error}`);
    }
  }

  /**
   * Get all badges for user
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const snapshot = await getDocs(
        query(collection(this.db, "user_badges"), where("userId", "==", userId))
      );

      return snapshot.docs.map((doc) => {
        const data = doc.data() as UserBadgeDoc;
        return {
          id: doc.id,
          userId: data.userId,
          badgeId: data.badgeId as BadgeType,
          unlockedAt: data.unlockedAt,
          progress: data.progress,
          isNew: data.isNew,
        };
      });
    } catch (error) {
      throw new Error(`Failed to get user badges: ${error}`);
    }
  }

  /**
   * Check if user has specific badge
   */
  async hasBadge(userId: string, badgeId: BadgeType): Promise<boolean> {
    try {
      const snapshot = await getDocs(
        query(
          collection(this.db, "user_badges"),
          where("userId", "==", userId),
          where("badgeId", "==", badgeId)
        )
      );

      return !snapshot.empty;
    } catch (error) {
      throw new Error(`Failed to check badge: ${error}`);
    }
  }

  /**
   * Update badge progress
   */
  async updateBadgeProgress(userBadgeId: string, progress: number): Promise<void> {
    try {
      const docRef = doc(this.db, "user_badges", userBadgeId);
      await updateDoc(docRef, { progress });
    } catch (error) {
      throw new Error(`Failed to update badge progress: ${error}`);
    }
  }

  /**
   * Mark badge as viewed (notification shown)
   */
  async markBadgeAsViewed(userBadgeId: string): Promise<void> {
    try {
      const docRef = doc(this.db, "user_badges", userBadgeId);
      await updateDoc(docRef, {
        isNew: false,
        notificationSent: true,
      });
    } catch (error) {
      throw new Error(`Failed to mark badge as viewed: ${error}`);
    }
  }

  /**
   * Get new badges for user (not yet shown in notification)
   */
  async getNewBadges(userId: string): Promise<UserBadge[]> {
    try {
      const snapshot = await getDocs(
        query(
          collection(this.db, "user_badges"),
          where("userId", "==", userId),
          where("isNew", "==", true)
        )
      );

      return snapshot.docs.map((doc) => {
        const data = doc.data() as UserBadgeDoc;
        return {
          id: doc.id,
          userId: data.userId,
          badgeId: data.badgeId as BadgeType,
          unlockedAt: data.unlockedAt,
          progress: data.progress,
          isNew: data.isNew,
        };
      });
    } catch (error) {
      throw new Error(`Failed to get new badges: ${error}`);
    }
  }

  /**
   * Get badge statistics for user
   */
  async getBadgeStats(
    userId: string
  ): Promise<{ totalBadges: number; byRarity: Record<string, number> }> {
    try {
      const badges = await this.getUserBadges(userId);
      const definitions = await this.getAllDefinitions();

      const byRarity: Record<string, number> = {};

      badges.forEach((badge) => {
        const def = definitions.get(badge.badgeId);
        if (def) {
          byRarity[def.rarity] = (byRarity[def.rarity] || 0) + 1;
        }
      });

      return {
        totalBadges: badges.length,
        byRarity,
      };
    } catch (error) {
      throw new Error(`Failed to get badge stats: ${error}`);
    }
  }
}
