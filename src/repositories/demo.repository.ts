/**
 * Demo Repository
 * Handles demo user data and seeding
 */

import { getFirestore, doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { EcoScoreUser } from "@/domain/user/types";
import { logger } from "@/services/logger.service";

export type DemoSeedRecord = Record<string, unknown> & { id?: string };

export interface DemoUser {
  uid: string;
  email: string;
  displayName: string;
  profile: Record<string, unknown>;
  activities: DemoSeedRecord[];
  badges: DemoSeedRecord[];
  challenges: DemoSeedRecord[];
  insights: DemoSeedRecord[];
}

export class DemoRepository {
  private db = getFirestore();

  /**
   * Create demo user with all populated data
   */
  async createDemoUser(demoUser: EcoScoreUser): Promise<void> {
    try {
      const docRef = doc(this.db, "users", demoUser.uid);
      await setDoc(docRef, demoUser);

      logger.info("Demo user created", {
        userId: demoUser.uid,
        email: demoUser.profile.email,
      });
    } catch (error) {
      logger.error("Failed to create demo user", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get demo user by ID
   */
  async getDemoUser(userId: string): Promise<EcoScoreUser | null> {
    try {
      const docRef = doc(this.db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docSnap.data() as EcoScoreUser;
    } catch (error) {
      logger.error("Failed to get demo user", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Populate demo activities
   */
  async populateDemoActivities(userId: string, activities: DemoSeedRecord[]): Promise<void> {
    try {
      const batch = writeBatch(this.db);

      for (const activity of activities) {
        const docRef = doc(
          this.db,
          "users",
          userId,
          "activities",
          activity.id || Date.now().toString()
        );
        batch.set(docRef, activity);
      }

      await batch.commit();

      logger.info("Demo activities populated", {
        userId,
        count: activities.length,
      });
    } catch (error) {
      logger.error("Failed to populate demo activities", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Populate demo badges
   */
  async populateDemoBadges(userId: string, badges: DemoSeedRecord[]): Promise<void> {
    try {
      const batch = writeBatch(this.db);

      for (const badge of badges) {
        const docRef = doc(this.db, "users", userId, "badges", badge.id || Date.now().toString());
        batch.set(docRef, badge);
      }

      await batch.commit();

      logger.info("Demo badges populated", {
        userId,
        count: badges.length,
      });
    } catch (error) {
      logger.error("Failed to populate demo badges", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Populate demo challenges
   */
  async populateDemoChallenges(userId: string, challenges: DemoSeedRecord[]): Promise<void> {
    try {
      const batch = writeBatch(this.db);

      for (const challenge of challenges) {
        const docRef = doc(
          this.db,
          "users",
          userId,
          "challenges",
          challenge.id || Date.now().toString()
        );
        batch.set(docRef, challenge);
      }

      await batch.commit();

      logger.info("Demo challenges populated", {
        userId,
        count: challenges.length,
      });
    } catch (error) {
      logger.error("Failed to populate demo challenges", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Reset demo user (cleanup)
   */
  async resetDemoUser(userId: string): Promise<void> {
    try {
      // In production, would delete subcollections and user doc
      // For now, just log
      logger.info("Demo user reset", { userId });
    } catch (error) {
      logger.error("Failed to reset demo user", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export const demoRepository = new DemoRepository();
