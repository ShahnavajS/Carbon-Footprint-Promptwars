/**
 * Badges System Domain Types
 * Represents achievement badges users can unlock
 */

export type BadgeType =
  | "eco_beginner"
  | "streak_7"
  | "streak_30"
  | "streak_100"
  | "public_transport_hero"
  | "green_food_champion"
  | "energy_saver"
  | "climate_explorer"
  | "community_contributor"
  | "sharing_advocate"
  | "challenge_master"
  | "first_report";

export interface BadgeDefinition {
  id: BadgeType;
  name: string;
  description: string;
  category: "streak" | "habit" | "social" | "milestone";
  unlockCondition: BadgeUnlockCondition;
  icon: string; // SVG data or URL
  color: string; // Tailwind color class
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export interface BadgeUnlockCondition {
  type: "streak" | "count" | "challenge" | "time_based" | "custom";
  target?: number;
  category?: "food" | "transport" | "energy";
  duration?: number; // In days
  condition?: string; // Custom JS expression
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: BadgeType;
  unlockedAt: number;
  progress: number; // 0-100 for progress-based badges
  isNew: boolean; // Show celebration notification
}

export interface BadgeProgress {
  badgeId: BadgeType;
  isUnlocked: boolean;
  progress: number; // 0-100
  nextMilestone?: string;
  daysUntilUnlock?: number;
}
