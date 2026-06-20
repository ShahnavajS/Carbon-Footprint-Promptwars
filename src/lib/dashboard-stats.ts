/**
 * Pure dashboard derivation helpers.
 *
 * These were previously inlined in the dashboard component's render body. They
 * are extracted so the logic is unit-testable and reusable across the dashboard,
 * journey, and impact surfaces.
 */

export interface DashboardActivity {
  id: string;
  userId: string;
  type: string;
  category: string;
  carbonReduction: number;
  ecoPoints: number;
  timestamp: number;
  createdAt: number;
}

/** The default monthly carbon-savings goal, in kg CO₂. */
export const DEFAULT_MONTHLY_GOAL_KG = 100;

/** EcoScore gains 1 point per 5 eco-points earned (see ActivityService). */
export const ECO_SCORE_PER_POINTS = 5;

/**
 * Computes the EcoScore delta earned this week from a list of activities.
 * Returns the whole-number score change (+N this week).
 */
export function getWeeklyScoreChange(activities: DashboardActivity[], now = Date.now()): number {
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const weeklyPoints = activities
    .filter((a) => a.createdAt >= oneWeekAgo)
    .reduce((acc, a) => acc + a.ecoPoints, 0);
  return Math.round(weeklyPoints / ECO_SCORE_PER_POINTS);
}

/**
 * Progress (0–1) toward the monthly carbon-savings goal.
 * Clamped to [0, 1] so the UI never overflows.
 */
export function getMonthlyGoalProgress(
  carbonSavedKg: number,
  monthlyGoalKg = DEFAULT_MONTHLY_GOAL_KG
): number {
  if (monthlyGoalKg <= 0) return 0;
  return Math.min(1, Math.max(0, carbonSavedKg / monthlyGoalKg));
}

/**
 * Human-readable "time ago" string (e.g. "Just now", "12m ago", "3h ago").
 * Falls back to a localized date for anything older than a day.
 */
export function formatTimeAgo(timestamp: number, now = Date.now()): string {
  const seconds = Math.floor((now - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

/** Emoji used to represent a category inline (food/transport/energy). */
export function getCategoryEmoji(category: string): string {
  switch (category) {
    case "food":
      return "🍔";
    case "transport":
      return "🚌";
    case "energy":
      return "⚡";
    default:
      return "🌱";
  }
}

export interface MonthlyReport {
  /** Display label, e.g. "May 2026". */
  monthLabel: string;
  /** Total kg CO₂ prevented that month. */
  carbonPreventedKg: number;
  /** EcoPoints earned that month. */
  pointsEarned: number;
  /** Longest care streak maintained that month. */
  bestStreak: number;
  /** Category the user saved the most in (for the "primary habit"). */
  primaryCategory?: string;
}

/**
 * Builds a monthly report from a list of activities for the current calendar
 * month.
 *
 * Returns null when there is no activity to report on, so the UI can render an
 * honest empty state instead of a fake mockup.
 */
export function buildMonthlyReport(
  activities: DashboardActivity[],
  streak: number,
  now = Date.now()
): MonthlyReport | null {
  if (activities.length === 0) return null;

  const date = new Date(now);
  const monthLabel = date.toLocaleString("en-US", { month: "long", year: "numeric" });
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();

  const monthActivities = activities.filter((a) => a.createdAt >= monthStart);
  if (monthActivities.length === 0) return null;

  const carbonPreventedKg = monthActivities.reduce((acc, a) => acc + a.carbonReduction, 0);
  const pointsEarned = monthActivities.reduce((acc, a) => acc + a.ecoPoints, 0);

  // Primary category = the one with the most carbon saved.
  const byCategory = new Map<string, number>();
  for (const a of monthActivities) {
    byCategory.set(a.category, (byCategory.get(a.category) ?? 0) + a.carbonReduction);
  }
  let primaryCategory: string | undefined;
  let max = -1;
  for (const [cat, total] of byCategory) {
    if (total > max) {
      max = total;
      primaryCategory = cat;
    }
  }

  return {
    monthLabel,
    carbonPreventedKg,
    pointsEarned,
    bestStreak: streak,
    primaryCategory,
  };
}
