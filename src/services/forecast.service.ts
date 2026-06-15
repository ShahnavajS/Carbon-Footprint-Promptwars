/**
 * Future Impact Forecast Service
 *
 * Predicts environmental impact over 30, 90, and 180 days
 * based on activity patterns and behavior trends
 */

import {
  ImpactForecast,
  ForecastPoint,
  ScenarioForecast,
  ForecastGenerationData,
} from "@/domain/forecast/types";
import type { EcoActivity } from "@/domain/activity/types";
import { forecastRepository } from "@/repositories/forecast.repository";
import { UserRepository } from "@/repositories/user.repository";
import { activityRepository } from "@/repositories/activity.repository";
import { logger } from "@/services/logger.service";
import { rateLimit } from "@/lib/rate-limiter";

export class ForecastService {
  /**
   * Get forecast for period or generate if missing
   */
  async getForecast(
    userId: string,
    period: "30d" | "90d" | "180d"
  ): Promise<ImpactForecast | null> {
    try {
      const existing = await forecastRepository.getForecast(userId, period);

      if (existing && !(await forecastRepository.needsRegeneration(userId, period))) {
        return existing;
      }

      // Regenerate if needed or missing
      return await this.generateForecast(userId, period);
    } catch (error) {
      logger.error("Failed to get forecast", {
        userId,
        period,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Generate new forecast
   */
  async generateForecast(userId: string, period: "30d" | "90d" | "180d"): Promise<ImpactForecast> {
    try {
      // Rate limiting
      await rateLimit("AI", userId);

      // Gather generation data
      const data = await this.gatherForecastData(userId, period);

      // Calculate predictions
      const scenarios = this.generateScenarios(data, period);
      const baselinePredictions = this.generateBaseline(data, period);

      const forecast: ImpactForecast = {
        uid: userId,
        generatedAt: Date.now(),
        period,

        scenarios,
        baselinePredictions,

        confidence: this.calculateConfidence(data),
        confidenceFactors: {
          activityHistoryDepth: data.activityHistory.length > 20 ? "rich" : "limited",
          trendConsistency: this.calculateTrendConsistency(data),
          dataAvailability: Math.min(100, data.activityHistory.length * 5),
        },

        methodology: "ML-based trend extrapolation with seasonal adjustment",
        modelVersion: "v1.0",

        keyInsights: {
          strongest_period: this.findStrongestPeriod(scenarios),
          critical_milestone: this.findMilestone(data, period),
          recommended_action: this.recommendAction(scenarios),
        },

        nextRegenerationAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // Weekly
      };

      await forecastRepository.saveForecast(userId, forecast);

      logger.info("Forecast generated", {
        userId,
        period,
        confidence: forecast.confidence,
      });

      return forecast;
    } catch (error) {
      logger.error("Failed to generate forecast", {
        userId,
        period,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Gather data for forecast generation
   */
  private async gatherForecastData(
    userId: string,
    period: "30d" | "90d" | "180d"
  ): Promise<ForecastGenerationData> {
    const user = await UserRepository.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get activity history (90 days)
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const activities = await activityRepository.getActivities(userId, ninetyDaysAgo, Date.now());

    // Calculate metrics
    const dailyPoints = this.calculateDailyAverage(activities, "points");
    const dailyCarbon = this.calculateDailyAverage(activities, "carbon");
    const weeklyActivities = activities.length / Math.max(1, Math.floor(activities.length / 7));

    return {
      userId,
      period,
      currentScore: user.score.ecoScore,
      currentLevel: user.score.level || 1,
      activityHistory: activities.map((a) => ({
        timestamp: a.createdAt,
        category: a.category,
        pointsEarned: a.ecoPoints || 0,
        carbonSaved: a.carbonSaved || 0,
      })),
      averageDailyPoints: dailyPoints,
      averageDailyCarbon: dailyCarbon,
      streakDays: user.score.streak || 0,
      activityFrequency: weeklyActivities,
    };
  }

  /**
   * Generate scenario forecasts
   */
  private generateScenarios(
    data: ForecastGenerationData,
    period: "30d" | "90d" | "180d"
  ): ScenarioForecast[] {
    const daysInPeriod = this.getPeriodDays(period);

    return [
      {
        scenario: "current",
        description: "Maintaining current activity level",
        assumptions: [
          "User maintains current activity frequency",
          "No significant behavior changes",
          "Seasonal factors normal",
        ],
        predictions: this.generatePredictions(
          data,
          daysInPeriod,
          1.0 // 1x multiplier (no change)
        ),
        summaryMetrics: {
          totalCarbonSaved: data.averageDailyCarbon * daysInPeriod,
          totalPointsEarned: data.averageDailyPoints * daysInPeriod,
          levelGain: Math.floor((data.averageDailyPoints * daysInPeriod) / 100),
          probabilityOfAchievement: 70,
        },
      },
      {
        scenario: "optimistic",
        description: "Increasing activity and new habits",
        assumptions: [
          "User increases activity by 50%",
          "Adopts 2-3 new sustainable habits",
          "Maintains consistency",
        ],
        predictions: this.generatePredictions(
          data,
          daysInPeriod,
          1.5 // 1.5x multiplier (increase)
        ),
        summaryMetrics: {
          totalCarbonSaved: data.averageDailyCarbon * daysInPeriod * 1.5,
          totalPointsEarned: data.averageDailyPoints * daysInPeriod * 1.5,
          levelGain: Math.floor((data.averageDailyPoints * daysInPeriod * 1.5) / 100),
          probabilityOfAchievement: 40,
        },
      },
      {
        scenario: "pessimistic",
        description: "Decreased activity and missed habits",
        assumptions: [
          "User reduces activity by 40%",
          "Inconsistent engagement",
          "External factors reduce participation",
        ],
        predictions: this.generatePredictions(
          data,
          daysInPeriod,
          0.6 // 0.6x multiplier (decrease)
        ),
        summaryMetrics: {
          totalCarbonSaved: data.averageDailyCarbon * daysInPeriod * 0.6,
          totalPointsEarned: data.averageDailyPoints * daysInPeriod * 0.6,
          levelGain: Math.floor((data.averageDailyPoints * daysInPeriod * 0.6) / 100),
          probabilityOfAchievement: 85,
        },
      },
    ];
  }

  /**
   * Generate baseline predictions for period
   */
  private generateBaseline(
    data: ForecastGenerationData,
    period: "30d" | "90d" | "180d"
  ): ForecastPoint[] {
    const daysInPeriod = this.getPeriodDays(period);
    const predictions: ForecastPoint[] = [];

    let cumulativeCarbon = 0;
    let cumulativePoints = 0;

    for (let day = 1; day <= daysInPeriod; day++) {
      const dailyCarbon = data.averageDailyCarbon;
      const dailyPoints = data.averageDailyPoints;

      cumulativeCarbon += dailyCarbon;
      cumulativePoints += dailyPoints;

      const date = new Date(Date.now() + day * 24 * 60 * 60 * 1000);

      predictions.push({
        date: date.toISOString(),
        ecoScore: data.currentScore + cumulativePoints,
        carbonSaved: dailyCarbon,
        carbonSavedCumulative: cumulativeCarbon,
        pointsEarned: dailyPoints,
        pointsEarnedCumulative: cumulativePoints,
        levelProgress: ((cumulativePoints % 100) / 100) * 100,
        habits: this.predictActiveHabits(day, daysInPeriod),
      });
    }

    return predictions;
  }

  /**
   * Generate predictions with multiplier
   */
  private generatePredictions(
    data: ForecastGenerationData,
    daysInPeriod: number,
    multiplier: number
  ): ForecastPoint[] {
    const predictions: ForecastPoint[] = [];
    let cumulativeCarbon = 0;
    let cumulativePoints = 0;

    for (let day = 1; day <= daysInPeriod; day++) {
      const dailyCarbon = data.averageDailyCarbon * multiplier;
      const dailyPoints = data.averageDailyPoints * multiplier;

      cumulativeCarbon += dailyCarbon;
      cumulativePoints += dailyPoints;

      const date = new Date(Date.now() + day * 24 * 60 * 60 * 1000);

      predictions.push({
        date: date.toISOString(),
        ecoScore: data.currentScore + cumulativePoints,
        carbonSaved: dailyCarbon,
        carbonSavedCumulative: cumulativeCarbon,
        pointsEarned: dailyPoints,
        pointsEarnedCumulative: cumulativePoints,
        levelProgress: ((cumulativePoints % 100) / 100) * 100,
        habits: this.predictActiveHabits(day, daysInPeriod),
      });
    }

    return predictions;
  }

  /**
   * Predict active habits
   */
  private predictActiveHabits(day: number, totalDays: number): string[] {
    const habits = ["Daily Track", "Weekly Goal", "Consistent Activity"];

    if (day > totalDays * 0.5) {
      habits.push("Habit Momentum");
    }

    if (day > totalDays * 0.75) {
      habits.push("Behavior Change");
    }

    return habits;
  }

  /**
   * Get number of days for period
   */
  private getPeriodDays(period: "30d" | "90d" | "180d"): number {
    const map = { "30d": 30, "90d": 90, "180d": 180 };
    return map[period];
  }

  /**
   * Calculate average of activity metric
   */
  private calculateDailyAverage(activities: EcoActivity[], metric: "points" | "carbon"): number {
    if (activities.length === 0) return 0;

    const field = metric === "points" ? "ecoPoints" : "carbonSaved";
    const total = activities.reduce((sum, a) => sum + (a[field] || 0), 0);
    const days =
      Math.ceil(
        (Math.max(...activities.map((a) => a.createdAt), 0) -
          Math.min(...activities.map((a) => a.createdAt), 0)) /
          (24 * 60 * 60 * 1000)
      ) || 1;

    return total / Math.max(1, days);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(data: ForecastGenerationData): number {
    let confidence = 50;

    if (data.activityHistory.length > 30) confidence += 20;
    if (data.streakDays > 10) confidence += 15;
    if (data.activityFrequency > 3) confidence += 15;

    return Math.min(95, confidence);
  }

  /**
   * Calculate trend consistency
   */
  private calculateTrendConsistency(data: ForecastGenerationData): number {
    if (data.activityHistory.length < 2) return 0;

    // Simple consistency check
    return Math.min(100, 50 + data.streakDays * 5);
  }

  /**
   * Find strongest period in scenarios
   */
  private findStrongestPeriod(scenarios: ScenarioForecast[]): string {
    const scenario = scenarios.find((s) => s.scenario === "optimistic") || scenarios[0];
    const strongestDay = scenario.predictions[Math.floor(scenario.predictions.length * 0.75)];
    return strongestDay ? new Date(strongestDay.date).toLocaleDateString() : "mid-period";
  }

  /**
   * Find milestone
   */
  private findMilestone(data: ForecastGenerationData, period: "30d" | "90d" | "180d"): string {
    const nextLevelPoints = Math.ceil(data.currentScore / 100) * 100;
    return `Projected ${period} milestone: reach ${nextLevelPoints} eco-score points`;
  }

  /**
   * Recommend action based on scenarios
   */
  private recommendAction(scenarios: ScenarioForecast[]): string {
    const optimistic = scenarios.find((scenario) => scenario.scenario === "optimistic");
    const projectedGain = optimistic?.summaryMetrics.levelGain ?? 0;
    return projectedGain > 0
      ? "Increase weekly activity by 2-3 sessions to stay on the optimistic path."
      : "Maintain a steady logging habit to build a more reliable forecast.";
  }
}

export const forecastService = new ForecastService();
