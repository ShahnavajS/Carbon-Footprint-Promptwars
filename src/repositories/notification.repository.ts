/**
 * Notification Repository
 * Data access layer for notifications and FCM
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
  Notification,
  NotificationPreferences,
  FCMToken,
  NotificationQueue,
} from "@/domain/notification/types";
import type {
  NotificationDoc,
  NotificationPreferencesDoc,
  FCMTokenDoc,
} from "@/domain/firestore.schema";

export class NotificationRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Create notification
   */
  async create(notification: Omit<Notification, "id">): Promise<Notification> {
    try {
      const docRef = await addDoc(
        collection(this.db, "notifications"),
        notification as NotificationDoc
      );
      return {
        ...notification,
        id: docRef.id,
      };
    } catch (error) {
      throw new Error(`Failed to create notification: ${error}`);
    }
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const snapshot = await getDocs(
        query(collection(this.db, "notifications"), where("userId", "==", userId))
      );

      return snapshot.docs
        .sort((a, b) => {
          const aData = a.data() as NotificationDoc;
          const bData = b.data() as NotificationDoc;
          return bData.createdAt - aData.createdAt;
        })
        .slice(0, limit)
        .map((doc) => {
          const data = doc.data() as NotificationDoc;
          return {
            id: doc.id,
            ...data,
          } as Notification;
        });
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error}`);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(this.db, "notifications", notificationId);
      await updateDoc(docRef, {
        readAt: Date.now(),
      });
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error}`);
    }
  }

  /**
   * Get or create notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const snapshot = await getDocs(
        query(collection(this.db, "notification_preferences"), where("userId", "==", userId))
      );

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as NotificationPreferencesDoc;
        return {
          userId: data.userId,
          channels: data.channels,
          types: data.types,
          quietHours: data.quietHours,
          updatedAt: data.updatedAt,
        };
      }

      // Create default preferences
      await addDoc(collection(this.db, "notification_preferences"), {
        userId,
        channels: { fcm: true, inApp: true, email: false },
        types: {
          challenge_reminder: true,
          streak_reminder: true,
          badge_unlocked: true,
          report_ready: true,
          leaderboard_update: true,
          friend_activity: false,
          circle_invite: true,
          challenge_finished: true,
        },
        quietHours: {
          enabled: false,
          startTime: 22 * 60, // 10 PM
          endTime: 8 * 60, // 8 AM
        },
        updatedAt: Date.now(),
      } as NotificationPreferencesDoc);

      return {
        userId,
        channels: { fcm: true, inApp: true, email: false },
        types: {
          challenge_reminder: true,
          streak_reminder: true,
          badge_unlocked: true,
          report_ready: true,
          leaderboard_update: true,
          friend_activity: false,
          circle_invite: true,
          challenge_finished: true,
        },
        quietHours: {
          enabled: false,
          startTime: 22 * 60,
          endTime: 8 * 60,
        },
        updatedAt: Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to get preferences: ${error}`);
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const snapshot = await getDocs(
        query(collection(this.db, "notification_preferences"), where("userId", "==", userId))
      );

      if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, {
          ...preferences,
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      throw new Error(`Failed to update preferences: ${error}`);
    }
  }

  /**
   * Register FCM token
   */
  async registerFCMToken(
    userId: string,
    token: string,
    platform: "web" | "ios" | "android"
  ): Promise<FCMToken> {
    try {
      // Check if token already exists
      const snapshot = await getDocs(
        query(collection(this.db, "fcm_tokens"), where("token", "==", token))
      );

      if (!snapshot.empty) {
        // Update existing token
        await updateDoc(snapshot.docs[0].ref, {
          lastUsedAt: Date.now(),
          isActive: true,
        });

        const data = snapshot.docs[0].data() as FCMTokenDoc;
        return {
          id: snapshot.docs[0].id,
          ...data,
        };
      }

      // Create new token
      const docRef = await addDoc(collection(this.db, "fcm_tokens"), {
        userId,
        token,
        platform,
        registeredAt: Date.now(),
        lastUsedAt: Date.now(),
        isActive: true,
      } as FCMTokenDoc);

      return {
        id: docRef.id,
        userId,
        token,
        platform,
        registeredAt: Date.now(),
        lastUsedAt: Date.now(),
        isActive: true,
      };
    } catch (error) {
      throw new Error(`Failed to register FCM token: ${error}`);
    }
  }

  /**
   * Get active FCM tokens for user
   */
  async getActiveFCMTokens(userId: string): Promise<FCMToken[]> {
    try {
      const snapshot = await getDocs(
        query(
          collection(this.db, "fcm_tokens"),
          where("userId", "==", userId),
          where("isActive", "==", true)
        )
      );

      return snapshot.docs.map((doc) => {
        const data = doc.data() as FCMTokenDoc;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error) {
      throw new Error(`Failed to get FCM tokens: ${error}`);
    }
  }

  /**
   * Deactivate FCM token
   */
  async deactivateFCMToken(tokenId: string): Promise<void> {
    try {
      const docRef = doc(this.db, "fcm_tokens", tokenId);
      await updateDoc(docRef, {
        isActive: false,
      });
    } catch (error) {
      throw new Error(`Failed to deactivate FCM token: ${error}`);
    }
  }

  /**
   * Queue notification for sending
   */
  async queueNotification(
    queueItem: Omit<NotificationQueue, "id" | "attempts" | "lastAttempt">
  ): Promise<NotificationQueue> {
    try {
      const docRef = await addDoc(collection(this.db, "notification_queue"), {
        ...queueItem,
        attempts: 0,
        status: "pending",
      });

      return {
        id: docRef.id,
        ...queueItem,
        attempts: 0,
        status: "pending",
      };
    } catch (error) {
      throw new Error(`Failed to queue notification: ${error}`);
    }
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications(limit: number = 100): Promise<NotificationQueue[]> {
    try {
      const snapshot = await getDocs(
        query(collection(this.db, "notification_queue"), where("status", "==", "pending"))
      );

      return snapshot.docs.slice(0, limit).map((doc) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error) {
      throw new Error(`Failed to get pending notifications: ${error}`);
    }
  }

  /**
   * Update notification queue status
   */
  async updateQueueStatus(
    queueId: string,
    status: "sent" | "failed",
    error?: string
  ): Promise<void> {
    try {
      const docRef = doc(this.db, "notification_queue", queueId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: any = {
        status,
        lastAttempt: Date.now(),
      };

      if (error) {
        updates.error = error;
      }

      await updateDoc(docRef, updates);
    } catch (error) {
      throw new Error(`Failed to update queue status: ${error}`);
    }
  }
}
