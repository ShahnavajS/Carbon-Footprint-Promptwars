/**
 * Impact Forecast Validation Schemas
 * Using Zod for runtime validation
 */

import { z } from "zod";

// ─── Forecast Point Schema ──────────────────────────────────────────────────

export const ForecastPointSchema = z.object({
  date: z.string().datetime(),
  ecoScore: z.number().min(0).max(10000),
  carbonSaved: z.number().min(0),
  carbonSavedCumulative: z.number().min(0),
  pointsEarned: z.number().min(0),
  pointsEarnedCumulative: z.number().min(0),
  levelProgress: z.number().min(0).max(100),
  habits: z.array(z.string()).max(10),
});

// ─── Scenario Forecast Schema ───────────────────────────────────────────────

export const ScenarioForecastSchema = z.object({
  scenario: z.enum(["current", "optimistic", "pessimistic"]),
  description: z.string().min(10).max(500),
  assumptions: z.array(z.string()).min(1).max(10),
  predictions: z.array(ForecastPointSchema).min(1),

  summaryMetrics: z.object({
    totalCarbonSaved: z.number().min(0),
    totalPointsEarned: z.number().min(0),
    levelGain: z.number().min(0),
    probabilityOfAchievement: z.number().min(0).max(100),
  }),
});

// ─── Impact Forecast Schema ────────────────────────────────────────────────

export const ImpactForecastSchema = z.object({
  uid: z.string().min(1),
  generatedAt: z.number().positive(),
  period: z.enum(["30d", "90d", "180d"]),

  scenarios: z.array(ScenarioForecastSchema).min(1),
  baselinePredictions: z.array(ForecastPointSchema).min(1),

  confidence: z.number().min(0).max(100),
  confidenceFactors: z.object({
    activityHistoryDepth: z.string(),
    trendConsistency: z.number().min(0).max(100),
    dataAvailability: z.number().min(0).max(100),
  }),

  methodology: z.string().min(10).max(500),
  modelVersion: z.string(),

  keyInsights: z.object({
    strongest_period: z.string(),
    critical_milestone: z.string(),
    recommended_action: z.string(),
  }),

  nextRegenerationAt: z.number().positive(),
});

// ─── Forecast Generation Request Schema ────────────────────────────────────

export const ForecastGenerationRequestSchema = z.object({
  userId: z.string().min(1),
  period: z.enum(["30d", "90d", "180d"]),
  currentScore: z.number().min(0).max(10000),
  currentLevel: z.number().min(1),

  activityHistory: z.array(
    z.object({
      timestamp: z.number().positive(),
      category: z.string(),
      pointsEarned: z.number().min(0),
      carbonSaved: z.number().min(0),
    })
  ),

  averageDailyPoints: z.number().min(0),
  averageDailyCarbon: z.number().min(0),
  streakDays: z.number().min(0),
  activityFrequency: z.number().min(0),
});

// ─── Forecast Comparison Schema ─────────────────────────────────────────────

export const ForecastComparisonSchema = z.object({
  period: z.enum(["30d", "90d", "180d"]),
  scenarios: z.array(ScenarioForecastSchema),

  bestCase: z.object({
    scenario: z.enum(["current", "optimistic", "pessimistic"]),
    carbonSaved: z.number().min(0),
    pointsEarned: z.number().min(0),
    levelGain: z.number().min(0),
  }),

  worstCase: z.object({
    scenario: z.enum(["current", "optimistic", "pessimistic"]),
    carbonSaved: z.number().min(0),
    pointsEarned: z.number().min(0),
    levelGain: z.number().min(0),
  }),

  likelyCase: ScenarioForecastSchema,
});

// ─── Confidence Interval Schema ────────────────────────────────────────────

export const ConfidenceIntervalSchema = z.object({
  low: z.number().min(0),
  mid: z.number().min(0),
  high: z.number().min(0),
  confidence: z.number().min(0).max(100),
});

export type ImpactForecast = z.infer<typeof ImpactForecastSchema>;
export type ScenarioForecast = z.infer<typeof ScenarioForecastSchema>;
export type ForecastPoint = z.infer<typeof ForecastPointSchema>;
