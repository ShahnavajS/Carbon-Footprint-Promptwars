/**
 * Shareable Card Repository
 * Data access layer for shareable cards and social sharing
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
import { ShareableCard, ShareEvent } from "@/domain/shareable-card/types";
import type { ShareableCardDoc } from "@/domain/firestore.schema";

export class ShareableCardRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Create shareable card
   */
  async create(card: Omit<ShareableCard, "id">): Promise<ShareableCard> {
    try {
      const docRef = await addDoc(collection(this.db, "shareable_cards"), card as ShareableCardDoc);
      return {
        ...card,
        id: docRef.id,
      };
    } catch (error) {
      throw new Error(`Failed to create shareable card: ${error}`);
    }
  }

  /**
   * Get card by ID
   */
  async getById(cardId: string): Promise<ShareableCard | null> {
    try {
      const docRef = doc(this.db, "shareable_cards", cardId);
      const snapshot = await getDocs(
        query(collection(this.db, "shareable_cards"), where("__name__", "==", docRef.id))
      );

      if (snapshot.empty) return null;

      const data = snapshot.docs[0].data() as ShareableCardDoc;
      return {
        id: snapshot.docs[0].id,
        ...(data as Omit<ShareableCard, "id">),
      };
    } catch (error) {
      throw new Error(`Failed to get shareable card: ${error}`);
    }
  }

  /**
   * Get cards for user
   */
  async getUserCards(userId: string, type?: string, limit: number = 50): Promise<ShareableCard[]> {
    try {
      let q;

      if (type) {
        q = query(
          collection(this.db, "shareable_cards"),
          where("userId", "==", userId),
          where("type", "==", type)
        );
      } else {
        q = query(collection(this.db, "shareable_cards"), where("userId", "==", userId));
      }

      const snapshot = await getDocs(q);

      return snapshot.docs
        .sort((a, b) => {
          const aData = a.data() as ShareableCardDoc;
          const bData = b.data() as ShareableCardDoc;
          return bData.createdAt - aData.createdAt;
        })
        .slice(0, limit)
        .map((doc) => {
          const data = doc.data() as ShareableCardDoc;
          return {
            id: doc.id,
            ...(data as Omit<ShareableCard, "id">),
          };
        });
    } catch (error) {
      throw new Error(`Failed to get user cards: ${error}`);
    }
  }

  /**
   * Record share event
   */
  async recordShare(
    cardId: string,
    userId: string,
    platform: "twitter" | "facebook" | "whatsapp" | "instagram" | "email" | "link"
  ): Promise<ShareEvent> {
    try {
      const docRef = await addDoc(collection(this.db, `shareable_cards/${cardId}/shares`), {
        cardId,
        userId,
        platform,
        sharedAt: Date.now(),
      });

      // Update share count
      const card = await this.getById(cardId);
      if (card) {
        const newStats = { ...card.stats };
        newStats.shared++;
        newStats.platforms[platform] = (newStats.platforms[platform] || 0) + 1;

        await this.updateStats(cardId, newStats);
      }

      return {
        id: docRef.id,
        cardId,
        userId,
        platform,
        sharedAt: Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to record share: ${error}`);
    }
  }

  /**
   * Record click event
   */
  async recordClick(cardId: string): Promise<void> {
    try {
      const card = await this.getById(cardId);
      if (card) {
        const newStats = { ...card.stats };
        newStats.clicked++;

        await this.updateStats(cardId, newStats);
      }
    } catch (error) {
      throw new Error(`Failed to record click: ${error}`);
    }
  }

  /**
   * Update card stats
   */
  async updateStats(cardId: string, stats: Partial<Record<string, unknown>>): Promise<void> {
    try {
      const docRef = doc(this.db, "shareable_cards", cardId);
      await updateDoc(docRef, {
        stats,
      });
    } catch (error) {
      throw new Error(`Failed to update card stats: ${error}`);
    }
  }

  /**
   * Get shares for card
   */
  async getShares(cardId: string): Promise<ShareEvent[]> {
    try {
      const snapshot = await getDocs(collection(this.db, `shareable_cards/${cardId}/shares`));

      return snapshot.docs.map((doc) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error) {
      throw new Error(`Failed to get shares: ${error}`);
    }
  }

  /**
   * Delete shareable card
   */
  async delete(cardId: string): Promise<void> {
    try {
      const docRef = doc(this.db, "shareable_cards", cardId);
      await updateDoc(docRef, {
        deletedAt: Date.now(),
      });
    } catch (error) {
      throw new Error(`Failed to delete card: ${error}`);
    }
  }
}
