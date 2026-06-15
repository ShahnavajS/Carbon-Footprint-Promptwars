/**
 * Notification Service
 * Business logic for Firebase Cloud Messaging and notifications
 */

import { Firestore } from "firebase/firestore";
import { NotificationRepository } from "@/repositories/notification.repository";
import { NotificationType, NotificationPriority } from "@/domain/notification/types";

export class NotificationService {
  private notificationRepo: NotificationRepository;

  constructor(db: Firestore) {
    this.notificationRepo = new NotificationRepository(db);
  }

  /**
   * Send notification to user
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, string> = {},
    priority: NotificationPriority = "normal"
  ): Promise<string> {
    try {
      // Check user preferences
      const prefs = await this.notificationRepo.getPreferences(userId);

      // Check quiet hours
      if (this.isInQuietHours(prefs.quietHours)) {
        priority = "low";
      }

      // Check if notification type is enabled
      if (prefs.types[type] === false) {
        return ""; // Silent
      }

      // Create in-app notification
      const notification = await this.notificationRepo.create({
        userId,
        type,
        title,
        body,
        data,
        priority,
        createdAt: Date.now(),
      });

      // Queue FCM sending if enabled
      if (prefs.channels.fcm) {
        await this.notificationRepo.queueNotification({
          userId,
          type,
          payload: {
            title,
            body,
            data,
          },
          status: "pending",
          scheduledFor: Date.now(),
        });
      }

      return notification.id;
    } catch (error) {
      throw new Error(`Failed to send notification: ${error}`);
    }
  }

  /**
   * Send batch notifications
   */
  async sendBatch(
    notifications: Array<{
      userId: string;
      type: NotificationType;
      title: string;
      body: string;
      data?: Record<string, string>;
    }>
  ): Promise<number> {
    try {
      let sent = 0;

      for (const notif of notifications) {
        try {
          await this.sendNotification(
            notif.userId,
            notif.type,
            notif.title,
            notif.body,
            notif.data
          );
          sent++;
        } catch (error) {
          console.error(`Failed to send notification to ${notif.userId}:`, error);
        }
      }

      return sent;
    } catch (error) {
      throw new Error(`Failed to send batch notifications: ${error}`);
    }
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(userId: string, limit: number = 50) {
    try {
      return await this.notificationRepo.getUserNotifications(userId, limit);
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error}`);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.notificationRepo.markAsRead(notificationId);
    } catch (error) {
      throw new Error(`Failed to mark as read: ${error}`);
    }
  }

  /**
   * Register FCM token
   */
  async registerFCMToken(
    userId: string,
    token: string,
    platform: "web" | "ios" | "android"
  ): Promise<void> {
    try {
      await this.notificationRepo.registerFCMToken(userId, token, platform);
    } catch (error) {
      throw new Error(`Failed to register FCM token: ${error}`);
    }
  }

  /**
   * Update notification preferences
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updatePreferences(userId: string, preferences: any): Promise<void> {
    try {
      await this.notificationRepo.updatePreferences(userId, preferences);
    } catch (error) {
      throw new Error(`Failed to update preferences: ${error}`);
    }
  }

  /**
   * Send badge unlock notification
   */
  async notifyBadgeUnlock(userId: string, badgeName: string, badgeIcon: string): Promise<void> {
    try {
      await this.sendNotification(
        userId,
        "badge_unlocked",
        `🎉 Achievement Unlocked!`,
        `You've earned the "${badgeName}" badge!`,
        { badgeIcon, badgeName },
        "high"
      );
    } catch (error) {
      throw new Error(`Failed to notify badge unlock: ${error}`);
    }
  }

  /**
   * Send streak reminder
   */
  async notifyStreakReminder(userId: string, currentStreak: number): Promise<void> {
    try {
      await this.sendNotification(
        userId,
        "streak_reminder",
        `🔥 Keep the streak alive!`,
        `You have a ${currentStreak}-day streak. Log an activity today to keep it going!`,
        { streak: currentStreak.toString() },
        "high"
      );
    } catch (error) {
      throw new Error(`Failed to notify streak: ${error}`);
    }
  }

  /**
   * Send challenge reminder
   */
  async notifyChallengeReminder(userId: string, challengeName: string): Promise<void> {
    try {
      await this.sendNotification(
        userId,
        "challenge_reminder",
        `📢 Challenge reminder`,
        `Don't forget to participate in "${challengeName}"!`,
        { challenge: challengeName },
        "normal"
      );
    } catch (error) {
      throw new Error(`Failed to notify challenge: ${error}`);
    }
  }

  /**
   * Send report ready notification
   */
  async notifyReportReady(userId: string, month: string): Promise<void> {
    try {
      await this.sendNotification(
        userId,
        "report_ready",
        `📊 Your ${month} report is ready!`,
        `Check out your monthly EcoScore report and see how much you've saved.`,
        { month },
        "high"
      );
    } catch (error) {
      throw new Error(`Failed to notify report ready: ${error}`);
    }
  }

  /**
   * Send leaderboard update notification
   */
  async notifyLeaderboardUpdate(
    userId: string,
    newRank: number,
    previousRank: number
  ): Promise<void> {
    try {
      const message =
        newRank < previousRank
          ? `🚀 You moved up to rank #${newRank}!`
          : `📉 You're now at rank #${newRank}.`;

      await this.sendNotification(
        userId,
        "leaderboard_update",
        "Leaderboard Update",
        message,
        { newRank: newRank.toString(), previousRank: previousRank.toString() },
        newRank < previousRank ? "high" : "normal"
      );
    } catch (error) {
      throw new Error(`Failed to notify leaderboard update: ${error}`);
    }
  }

  /**
   * Check if in quiet hours
   */
  private isInQuietHours(quietHours: {
    enabled: boolean;
    startTime: number;
    endTime: number;
  }): boolean {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Handle overnight quiet hours
    if (quietHours.startTime > quietHours.endTime) {
      return currentTime >= quietHours.startTime || currentTime <= quietHours.endTime;
    }

    return currentTime >= quietHours.startTime && currentTime <= quietHours.endTime;
  }

  /**
   * Get pending notifications for batch sending (Cloud Function)
   */
  async getPendingForSending(limit: number = 100) {
    try {
      return await this.notificationRepo.getPendingNotifications(limit);
    } catch (error) {
      throw new Error(`Failed to get pending notifications: ${error}`);
    }
  }

  /**
   * Update queue status
   */
  async updateQueueStatus(
    queueId: string,
    status: "sent" | "failed",
    error?: string
  ): Promise<void> {
    try {
      await this.notificationRepo.updateQueueStatus(queueId, status, error);
    } catch (error) {
      throw new Error(`Failed to update queue status: ${error}`);
    }
  }
}
