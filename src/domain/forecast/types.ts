/**
 * Future Impact Forecast Domain
 *
 * Predicts user's environmental impact over 30, 90, and 180 days
 * based on current activity patterns and behavior trends.
 */

export interface ForecastPoint {
  date: string; // ISO 8601
  ecoScore: number;
  carbonSaved: number; // kg
  carbonSavedCumulative: number; // kg (total over period)
  pointsEarned: number;
  pointsEarnedCumulative: number;
  levelProgress: number; // 0-100 (progress to next level)
  habits: string[]; // Active habits predicted
}

export type ForecastScenario = "current" | "optimistic" | "pessimistic";

export interface ScenarioForecast {
  scenario: ForecastScenario;
  description: string; // Human-readable description
  assumptions: string[];
  predictions: ForecastPoint[];

  summaryMetrics: {
    totalCarbonSaved: number;
    totalPointsEarned: number;
    levelGain: number;
    probabilityOfAchievement: number; // 0-100
  };
}

export interface ImpactForecast {
  uid: string;
  generatedAt: number; // Timestamp
  period: "30d" | "90d" | "180d";

  // Multiple scenarios for comparison
  scenarios: ScenarioForecast[];

  // Baseline scenario (most likely)
  baselinePredictions: ForecastPoint[];

  // Confidence and metadata
  confidence: number; // 0-100
  confidenceFactors: {
    activityHistoryDepth: string;
    trendConsistency: number;
    dataAvailability: number;
  };

  // Methodology
  methodology: string;
  modelVersion: string;

  // Key insights
  keyInsights: {
    strongest_period: string;
    critical_milestone: string;
    recommended_action: string;
  };

  // Next generation
  nextRegenerationAt: number;
}

/**
 * Forecast Generation Input
 * Used by service to generate forecasts
 */
export interface ForecastGenerationData {
  userId: string;
  period: "30d" | "90d" | "180d";

  // Current state
  currentScore: number;
  currentLevel: number;

  // Activity patterns
  activityHistory: Array<{
    timestamp: number;
    category: string;
    pointsEarned: number;
    carbonSaved: number;
  }>;

  // Historical metrics
  averageDailyPoints: number;
  averageDailyCarbon: number;
  streakDays: number;
  activityFrequency: number; // activities per week
}

/**
 * Forecast Comparison Result
 * For displaying multiple scenarios side-by-side
 */
export interface ForecastComparison {
  period: "30d" | "90d" | "180d";
  scenarios: ScenarioForecast[];

  bestCase: {
    scenario: ForecastScenario;
    carbonSaved: number;
    pointsEarned: number;
    levelGain: number;
  };

  worstCase: {
    scenario: ForecastScenario;
    carbonSaved: number;
    pointsEarned: number;
    levelGain: number;
  };

  likelyCase: ScenarioForecast;
}

/**
 * Confidence Intervals for predictions
 * Shows range of possible outcomes
 */
export interface ConfidenceInterval {
  low: number;
  mid: number; // Most likely
  high: number;
  confidence: number; // 0-100
}
