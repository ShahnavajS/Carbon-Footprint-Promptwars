import type { JourneyLevel, JourneyMilestone, UserMilestone } from "@/domain/journey/types";
import type { EcoScoreUser } from "@/domain/user/types";
import {
  ECO_LEVELS,
  getEcoLevel,
  getNextEcoLevel,
  getEcoLevelProgress,
} from "@/domain/eco-score/levels";

// ─── Level Definitions ────────────────────────────────────────────────────────
//
// The journey level table is derived from the unified ECO_LEVELS config
// (src/domain/eco-score/levels.ts) so there is exactly one source of truth
// for score→level mappings across the whole app. `JOURNEY_LEVELS` is kept as
// a typed projection for the journey UI.

export const JOURNEY_LEVELS: JourneyLevel[] = ECO_LEVELS.map((l) => ({
  level: l.level,
  name: l.name,
  description: l.tagline,
  emoji: l.emoji,
  minScore: l.minScore,
  maxScore: l.maxScore,
  color: l.colorClass,
}));

// ─── Milestone Definitions ─────────────────────────────────────────────────────

export const JOURNEY_MILESTONES: JourneyMilestone[] = [
  // Score milestones — framed as biome healing, not just numbers.
  {
    id: "score_100",
    title: "First Green Shoot",
    description: "You've begun — the first leaf of change has broken the soil.",
    type: "score",
    threshold: 100,
    emoji: "🌱",
  },
  {
    id: "score_250",
    title: "Conscious Guardian",
    description: "Your awareness is becoming instinct. Every choice now carries intention.",
    type: "score",
    threshold: 250,
    emoji: "🌿",
  },
  {
    id: "score_500",
    title: "Ecosystem Tender",
    description: "Halfway to mastery — your biome is thriving because of you.",
    type: "score",
    threshold: 500,
    emoji: "🌳",
  },
  {
    id: "score_750",
    title: "Climate Role Model",
    description: "Others are noticing your example. Your habits ripple outward.",
    type: "score",
    threshold: 750,
    emoji: "⚡",
  },
  {
    id: "score_1000",
    title: "Planetary Guardian",
    description: "The summit of sustainability. You've shown what's possible.",
    type: "score",
    threshold: 1000,
    emoji: "🏆",
  },
  // Streak milestones — habit formation as living ritual.
  {
    id: "streak_3",
    title: "Sprouting Ritual",
    description: "Three days of care — a habit begins to take root.",
    type: "streak",
    threshold: 3,
    emoji: "🔥",
  },
  {
    id: "streak_7",
    title: "Week of Care",
    description: "A full week of green choices. This is how a forest grows — one day at a time.",
    type: "streak",
    threshold: 7,
    emoji: "🗓️",
  },
  {
    id: "streak_30",
    title: "Seasoned Steward",
    description: "A month of consistency. Your care has become part of who you are.",
    type: "streak",
    threshold: 30,
    emoji: "📅",
  },
  // Activity milestones — each action is a tangible contribution.
  {
    id: "activities_10",
    title: "Ten Choices",
    description: "Ten mindful actions. That's ten fewer clouds of greenhouse gas in our sky.",
    type: "activities",
    threshold: 10,
    emoji: "✅",
  },
  {
    id: "activities_50",
    title: "Half a Hundred",
    description: "Fifty green choices — a quiet movement of one, repeated.",
    type: "activities",
    threshold: 50,
    emoji: "💪",
  },
  {
    id: "activities_100",
    title: "Centurion of Care",
    description: "One hundred actions. Imagine if a hundred people each did what you've done.",
    type: "activities",
    threshold: 100,
    emoji: "💯",
  },
  // Carbon milestones — visceral, analogy-driven real-world impact.
  {
    id: "carbon_10",
    title: "Ten Kilograms Spared",
    description: "10 kg CO₂ prevented — that's a mature tree breathing clean air for 167 days.",
    type: "carbon",
    threshold: 10,
    emoji: "🌍",
  },
  {
    id: "carbon_50",
    title: "Half a Quintal",
    description: "50 kg CO₂ kept out of the sky — about 1,950 party balloons of greenhouse gas.",
    type: "carbon",
    threshold: 50,
    emoji: "🌎",
  },
  {
    id: "carbon_100",
    title: "A Month of Driving Avoided",
    description:
      "100 kg CO₂ prevented — equivalent to parking a typical car for 500 km, or a tree absorbing carbon for over a year.",
    type: "carbon",
    threshold: 100,
    emoji: "🌏",
  },
];

// ─── Journey Service ───────────────────────────────────────────────────────────

export const JourneyService = {
  /**
   * Returns the current JourneyLevel for a given EcoScore.
   * Delegates to the unified level system (single source of truth).
   */
  getLevel(ecoScore: number): JourneyLevel {
    const unified = getEcoLevel(ecoScore);
    return JOURNEY_LEVELS.find((l) => l.level === unified.level) ?? JOURNEY_LEVELS[0];
  },

  getNextLevel(ecoScore: number): JourneyLevel | null {
    const next = getNextEcoLevel(ecoScore);
    if (!next) return null;
    return JOURNEY_LEVELS.find((l) => l.level === next.level) ?? null;
  },

  /** Progress fraction (0–1) within the current level */
  getLevelProgress(ecoScore: number): number {
    return getEcoLevelProgress(ecoScore);
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
