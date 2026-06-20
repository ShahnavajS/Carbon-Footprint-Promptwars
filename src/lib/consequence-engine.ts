/**
 * Consequence Engine — projects a user's carbon trajectory into visceral,
 * real-world equivalents across three effort scenarios.
 *
 * Where the AnalogyEngine turns a single kg of CO₂ into a tangible comparison,
 * the ConsequenceEngine projects a *trajectory* (optimistic / steady / lapse)
 * over a year so the user can FEEL the stakes of sustained vs abandoned effort.
 *
 * Tone (per the ECCS emotion framework): hope-forward. The "lapse" scenario is
 * framed as "what we'd forgo," never as doom. We show opportunity cost, not
 * catastrophe.
 */

export type ConsequenceScenario = "optimistic" | "steady" | "lapse";

export interface ConsequenceInput {
  /** Average kg CO₂ saved per week from recent activity. */
  weeklyCarbonSavedKg: number;
  /** Current day streak (used to weight the optimistic scenario). */
  streak: number;
  /** Override now() for deterministic tests. */
  now?: number;
}

export interface ConsequenceProjection {
  scenario: ConsequenceScenario;
  /** Multiplier applied to the weekly average (effort scaling). */
  effortMultiplier: number;
  /** Projected kg CO₂ saved over the projection window. */
  annualCarbonKg: number;
  /** Tangible equivalents derived via documented constants. */
  equivalents: {
    treesYear: number; // a mature tree absorbs ~22 kg/yr
    carKm: number; // ~0.2 kg CO₂/km
    flights: number; // a short-haul flight ~250 kg CO₂
    balloons: number; // 1 kg CO₂ ≈ 39 balloons
  };
  /** One-line, in-voice label for the scenario (hope-forward). */
  label: string;
}

const WEEKS_PER_YEAR = 52;
const TREE_KG_PER_YEAR = 22;
const CAR_KG_PER_KM = 0.2;
const FLIGHT_KG = 250;
const BALLOONS_PER_KG = 39;

/**
 * Builds three projections from a weekly savings baseline:
 *   - optimistic: a building habit lifts output (scaled by streak momentum).
 *   - steady: current pace maintained.
 *   - lapse: effort drops — framed as what would be *forgone*.
 */
export function projectConsequences(input: ConsequenceInput): {
  optimistic: ConsequenceProjection;
  steady: ConsequenceProjection;
  lapse: ConsequenceProjection;
} {
  void input.now; // reserved for future date-relative framing
  const { weeklyCarbonSavedKg, streak } = input;

  // Optimistic multiplier: up to +50% for strong streaks, floor at +10%.
  const momentum = Math.min(1.5, 1.1 + Math.min(streak, 30) * 0.013);

  const optimistic = buildProjection("optimistic", weeklyCarbonSavedKg, momentum);
  const steady = buildProjection("steady", weeklyCarbonSavedKg, 1);
  // Lapse drops to 40% of pace — framed as forgo, not catastrophe.
  const lapse = buildProjection("lapse", weeklyCarbonSavedKg, 0.4);

  return { optimistic, steady, lapse };
}

function buildProjection(
  scenario: ConsequenceScenario,
  weeklyKg: number,
  multiplier: number
): ConsequenceProjection {
  const annualCarbonKg = Math.max(0, weeklyKg * multiplier * WEEKS_PER_YEAR);

  return {
    scenario,
    effortMultiplier: multiplier,
    annualCarbonKg: Math.round(annualCarbonKg),
    equivalents: {
      treesYear: Math.max(0, Math.round(annualCarbonKg / TREE_KG_PER_YEAR)),
      carKm: Math.max(0, Math.round(annualCarbonKg / CAR_KG_PER_KM)),
      flights: Math.max(0, Math.round((annualCarbonKg / FLIGHT_KG) * 10) / 10),
      balloons: Math.max(0, Math.round(annualCarbonKg * BALLOONS_PER_KG)),
    },
    label: LABELS[scenario],
  };
}

const LABELS: Record<ConsequenceScenario, string> = {
  optimistic: "If you keep building this habit",
  steady: "If you hold your current pace",
  lapse: "What we'd forgo if effort slips",
};
