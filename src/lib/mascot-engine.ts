/**
 * Mascot mood engine — pure logic.
 *
 * Derives the companion's emotional state from the user's streak, recent
 * activity, and biome progress. This is intentionally pure (no React) so it is
 * unit-testable and reusable across the mascot component, toasts, and the
 * celebration overlay.
 *
 * Design principle (per the ECCS emotion framework): moods are hope-forward.
 * The companion never shames — a lapsed streak yields "misses you" warmth, not
 * guilt. Negative states are framed as gentle encouragement.
 */

export type MascotMood =
  | "celebrating" // just completed an action / hit a milestone
  | "thriving" // strong streak, recent activity
  | "content" // active, healthy baseline
  | "hopeful" // new or returning user
  | "wistful"; // streak lapsed — gentle, never shaming

export interface MascotMoodInput {
  /** Current day streak. */
  streak: number;
  /** Best historical streak (for context on returning users). */
  bestStreak?: number;
  /** Timestamp (ms) of the most recent activity, or null if none. */
  lastActivityAt: number | null;
  /** EcoScore 0–1000, used to tune tone at higher levels. */
  ecoScore?: number;
  /** Override now() for deterministic tests. */
  now?: number;
}

export interface MascotMoodResult {
  mood: MascotMood;
  /** A short, in-voice line the companion "says". */
  line: string;
  /** Emoji shown next to / on the companion. */
  emoji: string;
  /** Whether the companion should animate (idle bounce etc.). */
  animated: boolean;
}

const DAY = 24 * 60 * 60 * 1000;

/** Lines keyed by mood. A small rotation keeps it from feeling repetitive. */
const LINES: Record<MascotMood, string[]> = {
  celebrating: [
    "You did it! The biome just felt a little greener. 🌿",
    "Another breath of fresh air for our world. Beautifully done!",
    "I felt that kindness ripple through the soil. Thank you!",
  ],
  thriving: [
    "Your streak is glowing — the canopy loves your rhythm.",
    "Day after day, you're nursing this little world back to life.",
    "Look at you grow! The biome is thriving alongside you.",
  ],
  content: [
    "Steady and kind — that's how forests grow, too.",
    "Every mindful choice waters something bigger than us.",
    "I'm right here, rooting for your next green step.",
  ],
  hopeful: [
    "Welcome! Even the mightiest forest starts as a single seed.",
    "Your first green choice is already a promise to the planet.",
    "So good to begin. I'll walk this path with you.",
  ],
  wistful: [
    "I've missed you — and so has the biome. Want to tend it today?",
    "It's okay to pause. The soil is patient, and so am I. 🌱",
    "Whenever you're ready, one small action is enough to begin again.",
  ],
};

const EMOJI: Record<MascotMood, string> = {
  celebrating: "🥳",
  thriving: "🌿",
  content: "😊",
  hopeful: "🌱",
  wistful: "🍂",
};

/**
 * Derives the mascot mood. The selection prioritizes the most emotionally
 * relevant signal:
 *   1. A very recent action (< 1h) → celebrating.
 *   2. A strong streak (≥ 7) with today/yesterday activity → thriving.
 *   3. Activity in the last 2 days → content.
 *   4. No activity yet → hopeful (new user).
 *   5. Streak lapsed (> 2 days since last action) → wistful (gentle).
 */
export function getMascotMood(input: MascotMoodInput): MascotMoodResult {
  const now = input.now ?? Date.now();
  const { streak, lastActivityAt } = input;

  // New user — no activity ever logged.
  if (lastActivityAt === null) {
    return buildMood("hopeful", now);
  }

  const sinceLast = now - lastActivityAt;

  // Within the last hour: celebrate the fresh action.
  if (sinceLast < 60 * 60 * 1000) {
    return buildMood("celebrating", now);
  }

  // Strong streak + active today or yesterday.
  const activeRecently = sinceLast < DAY;
  if (streak >= 7 && activeRecently) {
    return buildMood("thriving", now);
  }

  // Active within the last 2 days → content baseline.
  if (sinceLast < 2 * DAY) {
    return buildMood("content", now);
  }

  // Streak lapsed beyond 2 days → gentle, never shaming.
  return buildMood("wistful", now);
}

function buildMood(mood: MascotMood, now: number): MascotMoodResult {
  const pool = LINES[mood];
  // Deterministic rotation by day so it's stable within a session but varies
  // day-to-day (avoids a random() that would change on every render).
  const index = Math.floor(now / DAY) % pool.length;
  return {
    mood,
    line: pool[index],
    emoji: EMOJI[mood],
    animated: mood !== "wistful",
  };
}
