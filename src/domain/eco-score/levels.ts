/**
 * Unified EcoScore level system — single source of truth.
 *
 * Previously the codebase had 5 divergent score→level mappings
 * (eco-score.service, journey.service, twin.service, voice.service,
 * terra-biome.tsx, onboarding). They produced contradictory labels for the
 * same score and made the terra-biome "Champion" state unreachable.
 *
 * This module is the ONE place levels are defined. Every consumer imports
 * from here. The 5-level system is used because it is the richest and keeps
 * the Level-5 (Climate Champion) biome reachable from real progression.
 */

export interface EcoLevel {
  /** 1-based level number (1 = Seedling … 5 = Climate Champion). */
  level: number;
  /** Display name, e.g. "Green Explorer". */
  name: string;
  /** Short poetic tagline used on the Terra Biome card. */
  tagline: string;
  /** Emoji used inline next to the level name. */
  emoji: string;
  /** Lowest EcoScore (inclusive) in this level's range. */
  minScore: number;
  /** Highest EcoScore (inclusive) in this level's range. */
  maxScore: number;
  /** Tailwind text-color class for the level name/badge. */
  colorClass: string;
  /**
   * Filename of the biome Earth illustration under /earth-states/.
   * Drives the Terra Biome visual state.
   */
  biomeImage: string;
  /**
   * Machine tier used by AI prompts (twin/voice) — kept here so the AI
   * services never re-derive thresholds.
   */
  tier: "seedling" | "citizen" | "explorer" | "advocate" | "champion";
}

/** The canonical, ordered level table. Lowest level first. */
export const ECO_LEVELS: readonly EcoLevel[] = [
  {
    level: 1,
    name: "Seedling",
    tagline: "Every great forest begins with a single seed.",
    emoji: "🌱",
    minScore: 0,
    maxScore: 199,
    colorClass: "text-slate-600 dark:text-slate-400",
    biomeImage: "/earth-states/polluted_earth.png",
    tier: "seedling",
  },
  {
    level: 2,
    name: "Conscious",
    tagline: "Awareness is the first leaf of change.",
    emoji: "🌿",
    minScore: 200,
    maxScore: 399,
    colorClass: "text-emerald-500 dark:text-emerald-400",
    biomeImage: "/earth-states/recovering_earth.png",
    tier: "citizen",
  },
  {
    level: 3,
    name: "Green Explorer",
    tagline: "You're discovering the rhythm of a greener life.",
    emoji: "🌳",
    minScore: 400,
    maxScore: 599,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    biomeImage: "/earth-states/growing_ecosystem.png",
    tier: "explorer",
  },
  {
    level: 4,
    name: "Eco Hero",
    tagline: "Your habits are inspiring everyone around you.",
    emoji: "⚡",
    minScore: 600,
    maxScore: 799,
    colorClass: "text-amber-500 dark:text-amber-400",
    biomeImage: "/earth-states/emerald_sanctuary.png",
    tier: "advocate",
  },
  {
    level: 5,
    name: "Climate Champion",
    tagline: "A true guardian of the living Earth.",
    emoji: "🏆",
    minScore: 800,
    maxScore: 1000,
    colorClass: "text-purple-500 dark:text-purple-400",
    biomeImage: "/earth-states/champion_earth.png",
    tier: "champion",
  },
] as const;

/** Total number of levels. */
export const MAX_ECO_LEVEL = ECO_LEVELS.length;

/**
 * Returns the {@link EcoLevel} for a given EcoScore (0–1000).
 * Scores outside the range are clamped to the nearest level.
 */
export function getEcoLevel(ecoScore: number): EcoLevel {
  const clamped = Math.max(0, Math.min(1000, ecoScore));
  return ECO_LEVELS.find((l) => clamped >= l.minScore && clamped <= l.maxScore) ?? ECO_LEVELS[0];
}

/** Returns the next level above the given score, or null at the top. */
export function getNextEcoLevel(ecoScore: number): EcoLevel | null {
  const current = getEcoLevel(ecoScore);
  return ECO_LEVELS.find((l) => l.level === current.level + 1) ?? null;
}

/** Progress fraction (0–1) through the current level. */
export function getEcoLevelProgress(ecoScore: number): number {
  const level = getEcoLevel(ecoScore);
  const range = level.maxScore - level.minScore;
  const progress = ecoScore - level.minScore;
  return range <= 0 ? 0 : Math.min(1, Math.max(0, progress / range));
}

/**
 * Returns the 1-based level number for a given EcoScore.
 * Convenience for call sites that previously computed their own level int.
 */
export function getEcoLevelNumber(ecoScore: number): number {
  return getEcoLevel(ecoScore).level;
}

/**
 * Returns the machine tier label used by AI services (twin/voice).
 * Replaces the duplicated private `calculateLevel` methods.
 */
export function getEcoTier(ecoScore: number): EcoLevel["tier"] {
  return getEcoLevel(ecoScore).tier;
}
