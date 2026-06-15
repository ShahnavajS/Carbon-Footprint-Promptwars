/**
 * Visualization Validation Schemas
 * Using Zod for runtime validation
 */

import { z } from "zod";

// ─── Environmental Equivalents Schema ───────────────────────────────────────

export const EnvironmentalEquivalentsSchema = z.object({
  carbonSaved: z.number().min(0),
  treesPlanted: z.number().min(0),
  treesShaded: z.number().min(0),
  flightsAvoided: z.number().min(0),
  carKmAvoided: z.number().min(0),
  lightbulbDaysEquivalent: z.number().min(0),
  showersAvoided: z.number().min(0),
  description: z.string().min(10).max(500),
  comparisonPhrase: z.string().min(5).max(300),
});

// ─── Category Breakdown Schema ──────────────────────────────────────────────

export const CategoryBreakdownSchema = z.object({
  category: z.enum(["food", "transport", "energy", "other"]),
  name: z.string(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),

  totalCarbon: z.number().min(0),
  totalPoints: z.number().min(0),
  percentageOfTotal: z.number().min(0).max(100),

  activityCount: z.number().min(0),
  averagePointsPerActivity: z.number().min(0),
  averageCarbonPerActivity: z.number().min(0),

  trend: z.enum(["up", "down", "stable"]),
  trendChange: z.number(),
});

// ─── Timeline Point Schema ────────────────────────────────────────────────

export const TimelinePointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayOfWeek: z.number().min(0).max(6),
  week: z.number().min(0),
  month: z.number().min(1).max(12),

  activitiesLogged: z.number().min(0),
  totalPoints: z.number().min(0),
  totalCarbon: z.number().min(0),
  streakDay: z.boolean(),

  intensity: z.number().min(0).max(100),
  intensityLevel: z.enum(["none", "low", "medium", "high", "very_high"]),
});

// ─── Impact Chart Data Schema ──────────────────────────────────────────────

export const ImpactChartDataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ecoScore: z.number().min(0),
  carbonSavedDaily: z.number().min(0),
  pointsDaily: z.number().min(0),
  cumulativeCarbon: z.number().min(0),
  cumulativePoints: z.number().min(0),
  streakDays: z.number().min(0),
});

// ─── Comparison Data Schema ────────────────────────────────────────────────

export const ComparisonDataSchema = z.object({
  userValue: z.number().min(0),
  peerAverage: z.number().min(0),
  goal: z.number().min(0).optional(),
  topPerformer: z.number().min(0).optional(),

  percentageVsPeer: z.number(),
  percentageOfGoal: z.number().optional(),
});

// ─── Visualization Metrics Schema ───────────────────────────────────────────

export const VisualizationMetricsSchema = z.object({
  period: z.enum(["week", "month", "year", "all"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  totalCarbon: z.number().min(0),
  totalPoints: z.number().min(0),
  avgDaily: z.object({
    carbon: z.number().min(0),
    points: z.number().min(0),
  }),

  byCategory: z.array(CategoryBreakdownSchema),
  byDayOfWeek: z.array(
    z.object({
      day: z.string(),
      activities: z.number().min(0),
      carbon: z.number().min(0),
      points: z.number().min(0),
    })
  ),

  timeline: z.array(TimelinePointSchema),

  vsLastPeriod: ComparisonDataSchema,
  vsPeerAverage: ComparisonDataSchema,

  equivalents: EnvironmentalEquivalentsSchema,

  topActivities: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      count: z.number().min(1),
      totalCarbon: z.number().min(0),
      totalPoints: z.number().min(0),
    })
  ),

  insights: z.object({
    bestDay: z.string(),
    worstDay: z.string(),
    mostProductiveCategory: z.string(),
    trend: z.enum(["improving", "declining", "stable"]),
    consistency: z.number().min(0).max(100),
  }),
});

// ─── Heatmap Cell Schema ────────────────────────────────────────────────────

export const HeatmapCellSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  week: z.number().min(0),
  dayOfWeek: z.number().min(0).max(6),
  value: z.number().min(0).max(100),
  activities: z.number().min(0),
  carbon: z.number().min(0),
  points: z.number().min(0),
  tooltip: z.string(),
});

// ─── Impact Distribution Schema ────────────────────────────────────────────

export const ImpactDistributionSchema = z.object({
  dimension: z.enum(["category", "dayOfWeek", "hourOfDay", "activityType"]),
  values: z.array(
    z.object({
      label: z.string(),
      carbon: z.number().min(0),
      points: z.number().min(0),
      activities: z.number().min(0),
      percentage: z.number().min(0).max(100),
    })
  ),
});

// ─── Peer Comparison Schema ────────────────────────────────────────────────

export const PeerComparisonSchema = z.object({
  userRank: z.number().min(1),
  userPercentile: z.number().min(0).max(100),
  groupSize: z.number().min(1),

  userEcoScore: z.number().min(0),
  peerAverage: z.number().min(0),
  peerMedian: z.number().min(0),
  topScore: z.number().min(0),

  userCarbon: z.number().min(0),
  peerAverageCarbon: z.number().min(0),

  userLevel: z.string(),
  mostCommonLevel: z.string(),
});

export type EnvironmentalEquivalents = z.infer<typeof EnvironmentalEquivalentsSchema>;
export type CategoryBreakdown = z.infer<typeof CategoryBreakdownSchema>;
export type VisualizationMetrics = z.infer<typeof VisualizationMetricsSchema>;
