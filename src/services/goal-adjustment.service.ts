import type { EcoActivity } from "@/domain/activity/types";
import type { GoalDifficulty, GoalDifficultyLevel } from "@/domain/journey/types";
import { trackEvent } from "./analytics";
import { UserRepository } from "@/repositories/user.repository";

// ─── Difficulty Presets ───────────────────────────────────────────────────────

export const DIFFICULTY_PRESETS: Record<GoalDifficultyLevel, GoalDifficulty> = {
  easy: {
    level: "easy",
    weeklyActivityTarget: 2,
    weeklyPointsTarget: 20,
    label: "2 actions/week",
  },
  medium: {
    level: "medium",
    weeklyActivityTarget: 4,
    weeklyPointsTarget: 50,
    label: "4 actions/week",
  },
  hard: {
    level: "hard",
    weeklyActivityTarget: 7,
    weeklyPointsTarget: 90,
    label: "Daily action",
  },
};

// ─── Goal Adjustment Service ──────────────────────────────────────────────────

export const GoalAdjustmentService = {
  /**
   * Evaluates the user's last 7 days of activity and recommends a difficulty level.
   * No AI call — pure rule-based logic for instant, deterministic adjustment.
   *
   * Rules:
   *  ≥ 7 activities/week → increase difficulty (succeeding consistently)
   *  < 2 activities/week → decrease difficulty (struggling)
   *  2–6 activities/week → maintain current difficulty (on track)
   */
  evaluateDifficulty(
    recentActivities: EcoActivity[],
    currentDifficulty: GoalDifficultyLevel = "medium"
  ): { newDifficulty: GoalDifficultyLevel; adjusted: boolean; reason: string } {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const lastWeekActivities = recentActivities.filter((a) => a.createdAt >= oneWeekAgo);
    const count = lastWeekActivities.length;

    if (count >= 7 && currentDifficulty !== "hard") {
      const newDifficulty: GoalDifficultyLevel = currentDifficulty === "easy" ? "medium" : "hard";
      return {
        newDifficulty,
        adjusted: true,
        reason: `Great work logging ${count} actions this week! We've increased your goal to keep you challenged.`,
      };
    }

    if (count < 2 && currentDifficulty !== "easy") {
      const newDifficulty: GoalDifficultyLevel = currentDifficulty === "hard" ? "medium" : "easy";
      return {
        newDifficulty,
        adjusted: true,
        reason: `Life gets busy. We've made your goal more achievable so you can build momentum.`,
      };
    }

    return {
      newDifficulty: currentDifficulty,
      adjusted: false,
      reason: "You're right on track — keep going!",
    };
  },

  /**
   * Evaluates difficulty and writes the updated goal to the user's Firestore profile.
   */
  async adjustAndPersist(
    userId: string,
    recentActivities: EcoActivity[],
    currentDifficulty: GoalDifficultyLevel = "medium"
  ): Promise<{ adjusted: boolean; newDifficulty: GoalDifficultyLevel; reason: string }> {
    const result = this.evaluateDifficulty(recentActivities, currentDifficulty);

    if (result.adjusted) {
      await UserRepository.updateUser(userId, {
        // Store difficulty in the score object's extended field
        score: { goalDifficulty: result.newDifficulty } as never,
      });

      trackEvent("goal_adjusted", {
        userId,
        previousDifficulty: currentDifficulty,
        newDifficulty: result.newDifficulty,
        weeklyActivityCount: recentActivities.filter(
          (a) => a.createdAt >= Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length,
      });
    }

    return result;
  },
};

export default GoalAdjustmentService;
