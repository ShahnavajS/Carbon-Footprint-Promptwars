import type { JourneyLevel, JourneyMilestone, UserMilestone } from "@/domain/journey/types";
import type { EcoScoreUser } from "@/domain/user/types";

// ─── Level Definitions ────────────────────────────────────────────────────────

export const JOURNEY_LEVELS: JourneyLevel[] = [
  {
    level: 1,
    name: "Beginner",
    description: "Taking your first steps toward a sustainable lifestyle.",
    emoji: "🌱",
    minScore: 0,
    maxScore: 199,
    color: "text-slate-600",
  },
  {
    level: 2,
    name: "Conscious",
    description: "Building awareness and making intentional choices.",
    emoji: "🌿",
    minScore: 200,
    maxScore: 399,
    color: "text-emerald-500",
  },
  {
    level: 3,
    name: "Green Explorer",
    description: "Actively exploring and adopting sustainable habits.",
    emoji: "🌳",
    minScore: 400,
    maxScore: 599,
    color: "text-emerald-600",
  },
  {
    level: 4,
    name: "Eco Hero",
    description: "Leading by example and inspiring others around you.",
    emoji: "⚡",
    minScore: 600,
    maxScore: 799,
    color: "text-amber-500",
  },
  {
    level: 5,
    name: "Climate Champion",
    description: "A true champion of sustainability and climate action.",
    emoji: "🏆",
    minScore: 800,
    maxScore: 1000,
    color: "text-purple-500",
  },
];

// ─── Milestone Definitions ─────────────────────────────────────────────────────

export const JOURNEY_MILESTONES: JourneyMilestone[] = [
  // Score milestones
  {
    id: "score_100",
    title: "First 100",
    description: "Reach an EcoScore of 100",
    type: "score",
    threshold: 100,
    emoji: "🎯",
  },
  {
    id: "score_250",
    title: "Quarter Champion",
    description: "Reach an EcoScore of 250",
    type: "score",
    threshold: 250,
    emoji: "⭐",
  },
  {
    id: "score_500",
    title: "Halfway Hero",
    description: "Reach an EcoScore of 500",
    type: "score",
    threshold: 500,
    emoji: "🌟",
  },
  {
    id: "score_750",
    title: "Elite Eco Warrior",
    description: "Reach an EcoScore of 750",
    type: "score",
    threshold: 750,
    emoji: "💫",
  },
  {
    id: "score_1000",
    title: "Perfect Score",
    description: "Reach the maximum EcoScore of 1000",
    type: "score",
    threshold: 1000,
    emoji: "🏆",
  },
  // Streak milestones
  {
    id: "streak_3",
    title: "3-Day Streak",
    description: "Log eco-actions 3 days in a row",
    type: "streak",
    threshold: 3,
    emoji: "🔥",
  },
  {
    id: "streak_7",
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    type: "streak",
    threshold: 7,
    emoji: "🗓️",
  },
  {
    id: "streak_30",
    title: "Monthly Habit",
    description: "Maintain a 30-day streak",
    type: "streak",
    threshold: 30,
    emoji: "📅",
  },
  // Activity milestones
  {
    id: "activities_10",
    title: "Getting Started",
    description: "Log 10 total eco-actions",
    type: "activities",
    threshold: 10,
    emoji: "✅",
  },
  {
    id: "activities_50",
    title: "Committed",
    description: "Log 50 total eco-actions",
    type: "activities",
    threshold: 50,
    emoji: "💪",
  },
  {
    id: "activities_100",
    title: "Century Club",
    description: "Log 100 total eco-actions",
    type: "activities",
    threshold: 100,
    emoji: "💯",
  },
  // Carbon milestones
  {
    id: "carbon_10",
    title: "10kg Saver",
    description: "Save 10 kg CO₂ in total",
    type: "carbon",
    threshold: 10,
    emoji: "🌍",
  },
  {
    id: "carbon_50",
    title: "50kg Hero",
    description: "Save 50 kg CO₂ in total",
    type: "carbon",
    threshold: 50,
    emoji: "🌎",
  },
  {
    id: "carbon_100",
    title: "100kg Champion",
    description: "Save 100 kg CO₂ — a monthly car journey equivalent!",
    type: "carbon",
    threshold: 100,
    emoji: "🌏",
  },
];

// ─── Journey Service ───────────────────────────────────────────────────────────

export const JourneyService = {
  /**
   * Returns the current JourneyLevel for a given EcoScore.
   * Uses the 5-level system (distinct from the 4-level onboarding system).
   */
  getLevel(ecoScore: number): JourneyLevel {
    return (
      JOURNEY_LEVELS.find((l) => ecoScore >= l.minScore && ecoScore <= l.maxScore) ??
      JOURNEY_LEVELS[0]
    );
  },

  getNextLevel(ecoScore: number): JourneyLevel | null {
    const current = this.getLevel(ecoScore);
    return JOURNEY_LEVELS.find((l) => l.level === current.level + 1) ?? null;
  },

  /** Progress fraction (0–1) within the current level */
  getLevelProgress(ecoScore: number): number {
    const level = this.getLevel(ecoScore);
    const range = level.maxScore - level.minScore;
    const progress = ecoScore - level.minScore;
    return Math.min(1, Math.max(0, progress / range));
  },

  /**
   * Evaluates all milestones against the user's current stats.
   * Returns milestones enriched with achieved status and progress.
   */
  evaluateMilestones(user: EcoScoreUser, totalActivities: number): UserMilestone[] {
    const score = user.score.ecoScore;
    const streak = user.score.bestStreak ?? user.score.streak;
    const carbonSaved = user.score.carbonSaved ?? 0;

    return JOURNEY_MILESTONES.map((milestone) => {
      let currentValue = 0;
      switch (milestone.type) {
        case "score":
          currentValue = score;
          break;
        case "streak":
          currentValue = streak;
          break;
        case "activities":
          currentValue = totalActivities;
          break;
        case "carbon":
          currentValue = carbonSaved;
          break;
      }

      const achieved = currentValue >= milestone.threshold;
      const progress = Math.min(1, currentValue / milestone.threshold);

      return {
        ...milestone,
        achieved,
        progress,
        achievedAt: achieved ? Date.now() : undefined,
      };
    });
  },
};

export default JourneyService;
