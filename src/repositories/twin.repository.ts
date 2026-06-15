/**
 * Sustainability Twin Repository
 * Handles CRUD operations for twin profiles
 */

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { SustainabilityTwin } from "@/domain/twin/types";
import { SustainabilityTwinSchema } from "@/domain/twin/schemas";
import { logger } from "@/services/logger.service";

export class TwinRepository {
  private db = getFirestore();
  private collection_name = "twins";

  /**
   * Get twin profile by user ID
   */
  async getTwin(userId: string): Promise<SustainabilityTwin | null> {
    try {
      const docRef = doc(this.db, "users", userId, this.collection_name, "profile");
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const validated = SustainabilityTwinSchema.parse(data);
      return validated;
    } catch (error) {
      logger.error("Failed to get twin profile", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Save/create twin profile
   */
  async saveTwin(userId: string, twin: SustainabilityTwin): Promise<void> {
    try {
      // Validate before saving
      const validated = SustainabilityTwinSchema.parse(twin);

      const docRef = doc(this.db, "users", userId, this.collection_name, "profile");
      await setDoc(docRef, validated);

      logger.info("Twin profile saved", {
        userId,
        level: twin.level,
        ecoScore: twin.ecoScore,
      });
    } catch (error) {
      logger.error("Failed to save twin profile", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update twin profile (partial update)
   */
  async updateTwin(userId: string, updates: Partial<SustainabilityTwin>): Promise<void> {
    try {
      const docRef = doc(this.db, "users", userId, this.collection_name, "profile");

      // Get existing to merge
      const existing = await this.getTwin(userId);
      if (!existing) {
        throw new Error("Twin profile not found");
      }

      const merged = { ...existing, ...updates };
      const validated = SustainabilityTwinSchema.parse(merged);

      await updateDoc(docRef, validated);

      logger.info("Twin profile updated", { userId });
    } catch (error) {
      logger.error("Failed to update twin profile", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete twin profile
   */
  async deleteTwin(userId: string): Promise<void> {
    try {
      const docRef = doc(this.db, "users", userId, this.collection_name, "profile");
      await updateDoc(docRef, { deletedAt: Timestamp.now() });

      logger.info("Twin profile deleted", { userId });
    } catch (error) {
      logger.error("Failed to delete twin profile", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if twin needs regeneration
   */
  async needsRegeneration(userId: string): Promise<boolean> {
    try {
      const twin = await this.getTwin(userId);
      if (!twin) {
        return true;
      }

      return Date.now() > twin.nextRegenerationAt;
    } catch (error) {
      logger.error("Failed to check twin regeneration", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return true;
    }
  }

  /**
   * Get all users needing twin regeneration (for Cloud Functions)
   */
  async getUsersNeedingRegeneration(limit: number = 100): Promise<string[]> {
    try {
      const snapshot = await getDocs(
        query(
          collection(this.db, "users"),
          where(`${this.collection_name}/profile/nextRegenerationAt`, "<", Date.now())
        )
      );

      return snapshot.docs.map((doc) => doc.id).slice(0, limit);
    } catch (error) {
      logger.error("Failed to get users needing regeneration", {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}

export const twinRepository = new TwinRepository();
