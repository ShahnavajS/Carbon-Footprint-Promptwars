/**
 * Notifications Domain Types
 * Firebase Cloud Messaging notification system
 */

export type NotificationType =
  | "challenge_reminder"
  | "streak_reminder"
  | "badge_unlocked"
  | "report_ready"
  | "leaderboard_update"
  | "friend_activity"
  | "circle_invite"
  | "challenge_finished";

export type NotificationPriority = "high" | "normal" | "low";
export type NotificationChannel = "fcm" | "in_app" | "email";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
  priority: NotificationPriority;
  createdAt: number;
  sentAt?: number;
  readAt?: number;
  actionUrl?: string; // Deep link to action
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    fcm: boolean;
    inApp: boolean;
    email: boolean;
  };
  types: {
    [key in NotificationType]?: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: number; // Minutes from midnight
    endTime: number;
  };
  updatedAt: number;
}

export interface FCMToken {
  id: string;
  userId: string;
  token: string;
  platform: "web" | "ios" | "android";
  registeredAt: number;
  lastUsedAt: number;
  isActive: boolean;
}

export interface NotificationQueue {
  id: string;
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
  status: "pending" | "sent" | "failed";
  scheduledFor?: number;
  attempts: number;
  lastAttempt?: number;
  error?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data: Record<string, string>;
  image?: string;
  badge?: string;
}

export interface NotificationStats {
  userId: string;
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}
