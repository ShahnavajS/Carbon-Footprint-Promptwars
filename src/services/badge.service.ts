/**
 * Badge Service
 * Business logic for badge unlocking and management
 */

import { Firestore } from "firebase/firestore";
import { BadgeRepository } from "@/repositories/badge.repository";
import { BadgeType, BadgeDefinition, UserBadge, BadgeProgress } from "@/domain/badges/types";

export class BadgeService {
  private badgeRepo: BadgeRepository;

  constructor(db: Firestore) {
    this.badgeRepo = new BadgeRepository(db);
  }

  /**
   * Define all badge types
   */
  private getBadgeDefinitions(): Map<BadgeType, BadgeDefinition> {
    return new Map<BadgeType, BadgeDefinition>([
      [
        "eco_beginner",
        {
          id: "eco_beginner",
          name: "Eco Beginner",
          description: "Complete your first activity",
          category: "milestone",
          unlockCondition: { type: "count", target: 1 },
          icon: "🌱",
          color: "emerald",
          rarity: "common",
        },
      ],
      [
        "streak_7",
        {
          id: "streak_7",
          name: "Week Warrior",
          description: "Maintain a 7-day streak",
          category: "streak",
          unlockCondition: { type: "streak", target: 7 },
          icon: "🔥",
          color: "orange",
          rarity: "uncommon",
        },
      ],
      [
        "streak_30",
        {
          id: "streak_30",
          name: "Month Master",
          description: "Maintain a 30-day streak",
          category: "streak",
          unlockCondition: { type: "streak", target: 30 },
          icon: "⭐",
          color: "amber",
          rarity: "rare",
        },
      ],
      [
        "streak_100",
        {
          id: "streak_100",
          name: "Century Champion",
          description: "Maintain a 100-day streak",
          category: "streak",
          unlockCondition: { type: "streak", target: 100 },
          icon: "👑",
          color: "yellow",
          rarity: "epic",
        },
      ],
      [
        "public_transport_hero",
        {
          id: "public_transport_hero",
          name: "Public Transport Hero",
          description: "Log 20 public transport activities",
          category: "habit",
          unlockCondition: { type: "count", target: 20, category: "transport" },
          icon: "🚌",
          color: "blue",
          rarity: "uncommon",
        },
      ],
      [
        "green_food_champion",
        {
          id: "green_food_champion",
          name: "Green Food Champion",
          description: "Log 30 vegetarian/vegan meals",
          category: "habit",
          unlockCondition: { type: "count", target: 30, category: "food" },
          icon: "🥗",
          color: "green",
          rarity: "uncommon",
        },
      ],
      [
        "energy_saver",
        {
          id: "energy_saver",
          name: "Energy Saver",
          description: "Log 25 energy-saving activities",
          category: "habit",
          unlockCondition: { type: "count", target: 25, category: "energy" },
          icon: "💡",
          color: "yellow",
          rarity: "uncommon",
        },
      ],
      [
        "climate_explorer",
        {
          id: "climate_explorer",
          name: "Climate Explorer",
          description: "View 3 insights",
          category: "social",
          unlockCondition: { type: "custom", condition: "insights_viewed >= 3" },
          icon: "🌍",
          color: "cyan",
          rarity: "uncommon",
        },
      ],
      [
        "community_contributor",
        {
          id: "community_contributor",
          name: "Community Contributor",
          description: "Join a friend circle",
          category: "social",
          unlockCondition: { type: "custom", condition: "circle_joined" },
          icon: "🤝",
          color: "purple",
          rarity: "uncommon",
        },
      ],
      [
        "sharing_advocate",
        {
          id: "sharing_advocate",
          name: "Sharing Advocate",
          description: "Share your report card",
          category: "social",
          unlockCondition: { type: "custom", condition: "report_shared" },
          icon: "📤",
          color: "rose",
          rarity: "common",
        },
      ],
      [
        "challenge_master",
        {
          id: "challenge_master",
          name: "Challenge Master",
          description: "Complete 5 challenges",
          category: "milestone",
          unlockCondition: { type: "count", target: 5 },
          icon: "🏆",
          color: "amber",
          rarity: "rare",
        },
      ],
      [
        "first_report",
        {
          id: "first_report",
          name: "Report Ready",
          description: "Generate your first monthly report",
          category: "milestone",
          unlockCondition: { type: "count", target: 1 },
          icon: "📊",
          color: "indigo",
          rarity: "common",
        },
      ],
    ]);
  }

  /**
   * Check and award badges for user
   */
  async checkAndAwardBadges(
    userId: string,
    context: {
      currentStreak?: number;
      activityCount?: number;
      categoryActivityCounts?: Record<string, number>;
      reportGenerated?: boolean;
      reportShared?: boolean;
      challengeCompleted?: boolean;
      circleJoined?: boolean;
    }
  ): Promise<UserBadge[]> {
    try {
      const definitions = this.getBadgeDefinitions();
      const newBadges: UserBadge[] = [];

      for (const [badgeId, definition] of definitions) {
        // Check if user already has badge
        const hasIt = await this.badgeRepo.hasBadge(userId, badgeId);
        if (hasIt) continue;

        // Check unlock condition
        const shouldUnlock = this.checkUnlockCondition(definition, context);
        if (shouldUnlock) {
          const badge = await this.badgeRepo.awardBadge(userId, badgeId);
          newBadges.push(badge);
        }
      }

      return newBadges;
    } catch (error) {
      throw new Error(`Failed to check and award badges: ${error}`);
    }
  }

  /**
   * Check if unlock condition is met
   */
  private checkUnlockCondition(
    definition: BadgeDefinition,
    context: Record<string, unknown>
  ): boolean {
    const { unlockCondition } = definition;

    switch (unlockCondition.type) {
      case "streak":
        return (context.currentStreak as number) >= (unlockCondition.target || 0);

      case "count":
        if (unlockCondition.category) {
          const categoryCount =
            (context.categoryActivityCounts as Record<string, number>)?.[
              unlockCondition.category
            ] || 0;
          return categoryCount >= (unlockCondition.target || 0);
        }
        return (context.activityCount as number) >= (unlockCondition.target || 0);

      case "custom":
        return this.evaluateCustomCondition(unlockCondition.condition || "", context);

      default:
        return false;
    }
  }

  /**
   * Evaluate custom unlock conditions
   */
  private evaluateCustomCondition(condition: string, context: Record<string, unknown>): boolean {
    if (condition === "insights_viewed >= 3") {
      return (context.insightsViewed as number) >= 3;
    }
    if (condition === "circle_joined") {
      return (context.circleJoined as boolean) === true;
    }
    if (condition === "report_shared") {
      return (context.reportShared as boolean) === true;
    }
    return false;
  }

  /**
   * Get all badge definitions
   */
  async getAllDefinitions(): Promise<Map<BadgeType, BadgeDefinition>> {
    return this.getBadgeDefinitions();
  }

  /**
   * Get badge progress for user
   */
  async getBadgeProgress(
    userId: string,
    context: Record<string, unknown>
  ): Promise<BadgeProgress[]> {
    try {
      const definitions = this.getBadgeDefinitions();
      const progress: BadgeProgress[] = [];
      const userBadges = await this.badgeRepo.getUserBadges(userId);
      const unlockedIds = new Set(userBadges.map((b) => b.badgeId));

      for (const [badgeId, definition] of definitions) {
        if (unlockedIds.has(badgeId)) {
          progress.push({
            badgeId,
            isUnlocked: true,
            progress: 100,
          });
        } else {
          // Calculate progress towards unlock
          const progressPercent = this.calculateProgress(definition, context);
          progress.push({
            badgeId,
            isUnlocked: false,
            progress: progressPercent,
            nextMilestone: definition.name,
          });
        }
      }

      return progress;
    } catch (error) {
      throw new Error(`Failed to get badge progress: ${error}`);
    }
  }

  /**
   * Calculate progress towards badge unlock
   */
  private calculateProgress(definition: BadgeDefinition, context: Record<string, unknown>): number {
    const { unlockCondition } = definition;

    switch (unlockCondition.type) {
      case "streak": {
        const current = (context.currentStreak as number) || 0;
        const target = unlockCondition.target || 1;
        return Math.min(100, Math.round((current / target) * 100));
      }

      case "count": {
        const current = unlockCondition.category
          ? (context.categoryActivityCounts as Record<string, number>)?.[
              unlockCondition.category
            ] || 0
          : (context.activityCount as number) || 0;
        const target = unlockCondition.target || 1;
        return Math.min(100, Math.round((current / target) * 100));
      }

      default:
        return 0;
    }
  }

  /**
   * Get user's collected badges
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      return await this.badgeRepo.getUserBadges(userId);
    } catch (error) {
      throw new Error(`Failed to get user badges: ${error}`);
    }
  }

  /**
   * Get badge statistics
   */
  async getBadgeStats(
    userId: string
  ): Promise<{ totalBadges: number; byRarity: Record<string, number> }> {
    try {
      return await this.badgeRepo.getBadgeStats(userId);
    } catch (error) {
      throw new Error(`Failed to get badge stats: ${error}`);
    }
  }
}
