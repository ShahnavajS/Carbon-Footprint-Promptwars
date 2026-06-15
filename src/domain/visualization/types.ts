/**
 * Carbon Impact Visualization Domain
 *
 * Provides data structures for advanced charts, maps, and impact visualizations.
 */

/**
 * Environmental Equivalents
 * Makes carbon impact relatable through real-world comparisons
 */
export interface EnvironmentalEquivalents {
  carbonSaved: number; // kg CO2e

  // Equivalents
  treesPlanted: number;
  treesShaded: number;
  flightsAvoided: number; // Short-haul flights
  carKmAvoided: number;
  lightbulbDaysEquivalent: number; // Days of LED bulb electricity
  showersAvoided: number;

  // Custom descriptions
  description: string;
  comparisonPhrase: string; // e.g., "equivalent to 3 round-trip flights"
}

/**
 * Category Breakdown
 * Carbon and points contribution by category
 */
export interface CategoryBreakdown {
  category: "food" | "transport" | "energy" | "other";
  name: string;
  color: string;

  // Metrics
  totalCarbon: number; // kg
  totalPoints: number;
  percentageOfTotal: number;

  // Activity stats
  activityCount: number;
  averagePointsPerActivity: number;
  averageCarbonPerActivity: number;

  // Trend
  trend: "up" | "down" | "stable";
  trendChange: number; // Percentage change from previous period
}

/**
 * Timeline Data Point
 * For activity heatmap and time-series visualization
 */
export interface TimelinePoint {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  week: number;
  month: number;

  // Activity metrics
  activitiesLogged: number;
  totalPoints: number;
  totalCarbon: number;
  streakDay: boolean; // Part of current/previous streak

  // Intensity (for heatmap)
  intensity: number; // 0-100
  intensityLevel: "none" | "low" | "medium" | "high" | "very_high";
}

/**
 * Impact Chart Data
 * Aggregated data for chart rendering (Recharts compatible)
 */
export interface ImpactChartData {
  date: string;
  ecoScore: number;
  carbonSavedDaily: number;
  pointsDaily: number;
  cumulativeCarbon: number;
  cumulativePoints: number;
  streakDays: number;
}

/**
 * Comparison Data
 * For comparing user metrics vs peer average or goal
 */
export interface ComparisonData {
  userValue: number;
  peerAverage: number;
  goal?: number;
  topPerformer?: number;

  percentageVsPeer: number; // 100 = equal, 150 = 50% above
  percentageOfGoal?: number; // 100 = met goal
}

/**
 * Visualization Metrics
 * Complete metrics for all visualizations
 */
export interface VisualizationMetrics {
  // Period
  period: "week" | "month" | "year" | "all";
  startDate: string;
  endDate: string;

  // Summary
  totalCarbon: number;
  totalPoints: number;
  avgDaily: {
    carbon: number;
    points: number;
  };

  // Breakdowns
  byCategory: CategoryBreakdown[];
  byDayOfWeek: Array<{
    day: string;
    activities: number;
    carbon: number;
    points: number;
  }>;

  // Timeline
  timeline: TimelinePoint[];

  // Comparisons
  vsLastPeriod: ComparisonData;
  vsPeerAverage: ComparisonData;

  // Environmental impact
  equivalents: EnvironmentalEquivalents;

  // Top activities
  topActivities: Array<{
    name: string;
    category: string;
    count: number;
    totalCarbon: number;
    totalPoints: number;
  }>;

  // Insights
  insights: {
    bestDay: string;
    worstDay: string;
    mostProductiveCategory: string;
    trend: "improving" | "declining" | "stable";
    consistency: number; // 0-100
  };
}

/**
 * Heatmap Cell
 * Individual cell in activity heatmap
 */
export interface HeatmapCell {
  date: string;
  week: number;
  dayOfWeek: number;
  value: number; // 0-100 intensity
  activities: number;
  carbon: number;
  points: number;
  tooltip: string;
}

/**
 * Impact Distribution
 * Shows distribution of impact across dimensions
 */
export interface ImpactDistribution {
  dimension: "category" | "dayOfWeek" | "hourOfDay" | "activityType";
  values: Array<{
    label: string;
    carbon: number;
    points: number;
    activities: number;
    percentage: number;
  }>;
}

/**
 * Peer Comparison
 * Anonymous comparison with peer group
 */
export interface PeerComparison {
  userRank: number;
  userPercentile: number; // 0-100
  groupSize: number;

  userEcoScore: number;
  peerAverage: number;
  peerMedian: number;
  topScore: number;

  userCarbon: number;
  peerAverageCarbon: number;

  userLevel: string;
  mostCommonLevel: string;
}
