// ─── Sustainability Journey Domain Types ──────────────────────────────────────

export interface JourneyLevel {
  level: number;
  name: string;
  description: string;
  emoji: string;
  minScore: number; // inclusive
  maxScore: number; // inclusive
  color: string; // Tailwind color token
}

export interface JourneyMilestone {
  id: string;
  title: string;
  description: string;
  /** Condition type for achievement */
  type: "score" | "streak" | "activities" | "challenges" | "carbon";
  /** Threshold value to achieve this milestone */
  threshold: number;
  emoji: string;
}

export interface UserMilestone extends JourneyMilestone {
  achieved: boolean;
  achievedAt?: number;
  progress: number; // 0–1 fraction of progress toward threshold
}

export type GoalDifficultyLevel = "easy" | "medium" | "hard";

export interface GoalDifficulty {
  level: GoalDifficultyLevel;
  /** Minimum activities per week the AI expects */
  weeklyActivityTarget: number;
  /** Points per week target */
  weeklyPointsTarget: number;
  label: string;
}
