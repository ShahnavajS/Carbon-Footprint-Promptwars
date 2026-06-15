import { ActivityRepository } from "@/repositories/activity.repository";
import { UserRepository } from "@/repositories/user.repository";
import { ChallengeRepository, DEFAULT_CHALLENGES } from "@/repositories/challenge.repository";
import { StreakService } from "./streak.service";
import { trackEvent } from "./analytics";
import type { ActivityCategory, ActionType, EcoActivity } from "@/domain/activity/types";
import type { UserScore } from "@/domain/user/types";
import { doc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/** Extended score shape that includes Phase-3 fields persisted in Firestore */
interface ExtendedScore extends UserScore {
  lastActivityAt?: number;
  bestStreak?: number;
  carbonSaved?: number;
}

export interface ActivityReward {
  points: number;
  carbon: number; // in kg
}

export const ACTIVITY_REWARDS: Record<ActionType, ActivityReward> = {
  "Vegetarian Meal": { points: 10, carbon: 0.8 },
  "Vegan Meal": { points: 15, carbon: 1.0 },
  "Home Cooked Meal": { points: 5, carbon: 0.3 },
  Walked: { points: 15, carbon: 1.5 },
  Bicycle: { points: 15, carbon: 1.3 },
  Metro: { points: 15, carbon: 1.2 },
  Bus: { points: 10, carbon: 0.8 },
  "Reduced AC Usage": { points: 10, carbon: 0.6 },
  "Switched Off Appliances": { points: 5, carbon: 0.4 },
  "Line Dried Clothes": { points: 10, carbon: 0.8 },
};

export const ActivityService = {
  async logActivity(
    userId: string,
    category: ActivityCategory,
    actionType: ActionType
  ): Promise<{ activity: EcoActivity; challengeCompleted: boolean }> {
    // 1. Fetch user profile
    const dbUser = await UserRepository.getUser(userId);
    if (!dbUser) {
      throw new Error("User profile not found in database.");
    }

    // 2. Fetch reward details
    const reward = ACTIVITY_REWARDS[actionType];
    if (!reward) {
      throw new Error(`Reward values not defined for action type: ${actionType}`);
    }

    let earnedPoints = reward.points;
    let earnedCarbon = reward.carbon;
    let challengeCompleted = false;

    // 3. Log activity to activities collection
    const activity = await ActivityRepository.logActivity({
      userId,
      category,
      actionType,
      ecoPoints: earnedPoints,
      carbonSaved: earnedCarbon,
      createdAt: Date.now(),
    });

    // Fire activity creation telemetry
    trackEvent("activity_created", {
      userId,
      category,
      actionType,
      ecoPoints: earnedPoints,
      carbonSaved: earnedCarbon,
    });

    // 4. Check daily challenge completions
    let matchedChallengeId = "";
    if (category === "transport" && (actionType === "Metro" || actionType === "Bus")) {
      matchedChallengeId = "challenge_transport";
    } else if (
      category === "food" &&
      (actionType === "Vegetarian Meal" || actionType === "Vegan Meal")
    ) {
      matchedChallengeId = "challenge_vegetarian";
    } else if (category === "energy" && actionType === "Reduced AC Usage") {
      matchedChallengeId = "challenge_ac";
    }

    if (matchedChallengeId) {
      const isAlreadyCompleted = await checkChallengeCompleted(userId, matchedChallengeId);

      if (!isAlreadyCompleted) {
        // Complete challenge
        await ChallengeRepository.completeChallenge(userId, matchedChallengeId);
        challengeCompleted = true;

        const challengeDef = DEFAULT_CHALLENGES.find((c) => c.id === matchedChallengeId);
        if (challengeDef) {
          earnedPoints += challengeDef.pointsReward;
          earnedCarbon += challengeDef.carbonReward;

          trackEvent("challenge_completed", {
            userId,
            challengeId: matchedChallengeId,
            pointsReward: challengeDef.pointsReward,
            carbonReward: challengeDef.carbonReward,
          });
        }
      }
    }

    // 5. Calculate new streak
    const scoreState: ExtendedScore = dbUser.score || { ecoScore: 0, level: 1, streak: 0 };
    const prevLastActivity = scoreState.lastActivityAt ?? null;
    const prevBestStreak = scoreState.bestStreak ?? 0;

    const streakUpdate = StreakService.calculateStreak(
      prevLastActivity,
      scoreState.streak,
      prevBestStreak
    );

    if (streakUpdate.currentStreak !== scoreState.streak) {
      trackEvent("streak_updated", {
        userId,
        currentStreak: streakUpdate.currentStreak,
        bestStreak: streakUpdate.bestStreak,
      });
    }

    // 6. Calculate new EcoScore and Level
    const oldScore = scoreState.ecoScore;
    // Multiplier: +1 score for every 5 eco points earned
    const addedScorePoints = Math.round(earnedPoints / 5);
    const newScoreValue = Math.min(1000, oldScore + addedScorePoints);

    // Dynamic level: Level 1 (0-250), Level 2 (251-500), Level 3 (501-750), Level 4 (751-1000)
    let newLevel = 1;
    if (newScoreValue > 750) newLevel = 4;
    else if (newScoreValue > 500) newLevel = 3;
    else if (newScoreValue > 250) newLevel = 2;

    if (newScoreValue !== oldScore) {
      trackEvent("eco_score_updated", {
        userId,
        oldScore,
        newScore: newScoreValue,
      });
    }

    // 7. Update carbon budget savings
    const prevCarbonSaved = scoreState.carbonSaved ?? 0;
    const newCarbonSaved = prevCarbonSaved + earnedCarbon;

    // 8. Write updates to user profile document
    const updatedScore: ExtendedScore = {
      ecoScore: newScoreValue,
      level: newLevel,
      streak: streakUpdate.currentStreak,
      bestStreak: streakUpdate.bestStreak,
      lastActivityAt: streakUpdate.lastActivityAt,
      carbonSaved: newCarbonSaved,
    };

    await UserRepository.updateUser(userId, {
      score: updatedScore,
    });

    return {
      activity,
      challengeCompleted,
    };
  },
};

// Internal helpers

/**
 * Deterministically checks if a challenge has been completed using a
 * point-in-time getDocs read rather than a realtime listener, avoiding
 * race conditions in the logActivity flow.
 */
async function checkChallengeCompleted(userId: string, challengeId: string): Promise<boolean> {
  const userDocRef = doc(db, "users", userId);
  const challCollRef = collection(userDocRef, "challenges");
  const snap = await getDocs(challCollRef);
  return snap.docs.some(
    (d) => d.id === challengeId && (d.data() as { completed?: boolean }).completed === true
  );
}
