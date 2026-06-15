// ─── What-If Simulator Domain Types ──────────────────────────────────────────

export type SimulatorCategory = "food" | "transport" | "energy";

export interface SimulatorScenario {
  id: string;
  label: string;
  category: SimulatorCategory;
  description: string;
  /** Weekly frequency assumption for calculations */
  weeklyFrequency: number;
  /** kg CO₂ saved per single occurrence */
  carbonSavedPerOccurrence: number;
  /** EcoPoints earned per single occurrence */
  pointsPerOccurrence: number;
  /** Approximate INR money saved per occurrence (fuel/electricity/food cost) */
  moneySavedPerOccurrence: number;
}

export interface SimulationResult {
  scenario: SimulatorScenario;
  /** Annual kg CO₂ saved */
  annualCarbonSaved: number;
  /** Monthly kg CO₂ saved */
  monthlyCarbonSaved: number;
  /** Estimated EcoScore improvement (capped at 1000) */
  ecoScoreImpact: number;
  /** Annual money saved in INR */
  annualMoneySaved: number;
  /** Tree-equivalent: trees needed to absorb this CO₂ in a year */
  treeEquivalent: number;
  /** km equivalent: km of car driving avoided */
  carKmEquivalent: number;
  /** AI narrative explanation (may be empty while loading) */
  aiExplanation: string;
}

// ─── PHASE 7: Multi-Scenario Comparison Types ────────────────────────────────

/**
 * Scenario with custom multipliers for multi-scenario builder
 */
export interface CustomScenario {
  id: string;
  name: string;
  description?: string;
  createdAt: number;

  // Custom behavior multipliers
  changes: {
    category: SimulatorCategory;
    action: string;
    multiplier: number; // e.g., 0.5 = 50% reduction, 1.5 = 50% increase
  }[];

  isBaseline: boolean;
  isBookmarked: boolean;
}

/**
 * Multi-scenario comparison result
 */
export interface ScenarioComparison {
  id: string;
  uid: string;
  name: string;

  // Baseline metrics
  baseline: {
    annualCarbon: number;
    annualPoints: number;
    annualCost: number;
  };

  // Multiple scenarios
  scenarios: CustomScenario[];
  results: Array<{
    scenarioId: string;
    scenarioName: string;
    annualCarbonSaved: number;
    annualPointsEarned: number;
    annualCostSavings: number;
    equivalents: {
      treesPlanted: number;
      flightsAvoided: number;
      carKmAvoided: number;
    };
    difficulty: "easy" | "medium" | "hard";
  }>;

  // Best option analysis
  bestOption: {
    scenarioId: string;
    metric: "carbon" | "cost" | "balanced";
    reason: string;
  };

  // Sharing
  shared: boolean;
  shareToken?: string;
  viewCount: number;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

/**
 * Environmental equivalents display
 */
export interface EnvironmentalEquivalents {
  carbonSaved: number; // kg CO2e
  treesPlanted: number;
  flightsAvoided: number;
  carKmAvoided: number;
  description: string;
}

/**
 * Scenario builder request
 */
export interface ScenarioBuildRequest {
  name: string;
  scenarios: Array<{
    name: string;
    changes: Array<{
      category: string;
      action: string;
      multiplier: number;
    }>;
  }>;
}
