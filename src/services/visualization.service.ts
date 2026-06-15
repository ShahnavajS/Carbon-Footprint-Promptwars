/**
 * Visualization Service
 *
 * Generates data for advanced visualizations:
 * - Impact charts
 * - Category breakdowns
 * - Activity heatmaps
 * - Environmental equivalents
 */

import {
  VisualizationMetrics,
  EnvironmentalEquivalents,
  CategoryBreakdown,
  TimelinePoint,
  ImpactChartData,
} from "@/domain/visualization/types";
import type { EcoActivity } from "@/domain/activity/types";
import { userRepository } from "@/repositories/user.repository";
import { activityRepository } from "@/repositories/activity.repository";
import { logger } from "@/services/logger.service";

export class VisualizationService {
  /**
   * Generate complete visualization metrics for a user
   */
  async generateMetrics(
    userId: string,
    period: "week" | "month" | "year" | "all" = "month"
  ): Promise<VisualizationMetrics> {
    try {
      const user = await userRepository.getUser(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Get time range
      const { startDate, endDate } = this.getDateRange(period);
      const startMs = new Date(startDate).getTime();
      const endMs = new Date(endDate).getTime();

      // Get activities for period
      const activities = await activityRepository.getActivities(userId, startMs, endMs);

      // Calculate metrics
      const totalCarbon = this.calculateMetric(activities, "carbon");
      const totalPoints = this.calculateMetric(activities, "points");
      const avgDaily = {
        carbon: totalCarbon / this.getDaysDifference(startDate, endDate),
        points: totalPoints / this.getDaysDifference(startDate, endDate),
      };

      // Breakdown by category
      const byCategory = this.breakdownByCategory(activities);

      // Timeline
      const timeline = this.generateTimeline(activities, startDate, endDate);

      // Previous period comparison
      const previousActivities = await activityRepository.getActivities(
        userId,
        startMs - (endMs - startMs),
        startMs
      );
      const previousPeriodCarbon = this.calculateMetric(previousActivities, "carbon");
      const vsLastPeriod = {
        userValue: totalCarbon,
        peerAverage: totalCarbon * 0.8, // Mock: assume user is 20% above average
        percentageVsPeer: 120,
        percentageOfGoal:
          previousPeriodCarbon > 0 ? (totalCarbon / previousPeriodCarbon) * 100 : 100,
      };

      // Environmental equivalents
      const equivalents = this.calculateEquivalents(totalCarbon);

      // Top activities
      const topActivities = this.getTopActivities(activities, 5);

      // Insights
      const insights = this.generateInsights(activities, byCategory);

      return {
        period,
        startDate,
        endDate,
        totalCarbon,
        totalPoints,
        avgDaily,
        byCategory,
        byDayOfWeek: this.breakdownByDayOfWeek(activities),
        timeline,
        vsLastPeriod,
        vsPeerAverage: {
          userValue: totalCarbon,
          peerAverage: totalCarbon * 0.8,
          percentageVsPeer: 120,
        },
        equivalents,
        topActivities,
        insights,
      };
    } catch (error) {
      logger.error("Failed to generate visualization metrics", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Calculate environmental equivalents
   */
  calculateEquivalents(carbonSaved: number): EnvironmentalEquivalents {
    const treesPlanted = Math.round(carbonSaved / 21); // 21kg CO2 per tree per year
    const flightsAvoided = Math.round(carbonSaved / 2200); // 2200kg per transatlantic flight
    const carKmAvoided = Math.round(carbonSaved / 0.21); // 0.21kg per km
    const lightbulbDays = Math.round((carbonSaved * 1000) / 54); // 54g per bulb per day

    return {
      carbonSaved,
      treesPlanted,
      treesShaded: Math.round(treesPlanted * 0.3),
      flightsAvoided,
      carKmAvoided,
      lightbulbDaysEquivalent: lightbulbDays,
      showersAvoided: Math.round(carbonSaved / 2.4), // 2.4kg per shower
      description: `You've saved ${carbonSaved.toFixed(0)}kg of CO₂`,
      comparisonPhrase: `equivalent to planting ${treesPlanted} trees or avoiding ${flightsAvoided} flights`,
    };
  }

  /**
   * Generate chart data for impact charts
   */
  async generateChartData(userId: string, days: number = 30): Promise<ImpactChartData[]> {
    try {
      const user = await userRepository.getUser(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const endDate = Date.now();
      const startDate = endDate - days * 24 * 60 * 60 * 1000;

      const activities = await activityRepository.getActivities(userId, startDate, endDate);

      const chartData: ImpactChartData[] = [];
      let cumulativeCarbon = 0;
      let cumulativePoints = 0;
      let streakDays = 0;

      for (let i = days - 1; i >= 0; i--) {
        const dayStart = endDate - i * 24 * 60 * 60 * 1000;
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;

        const dayActivities = activities.filter(
          (a) => a.createdAt >= dayStart && a.createdAt < dayEnd
        );

        const dailyCarbon = dayActivities.reduce((sum, a) => sum + (a.carbonSaved || 0), 0);
        const dailyPoints = dayActivities.reduce((sum, a) => sum + (a.ecoPoints || 0), 0);

        cumulativeCarbon += dailyCarbon;
        cumulativePoints += dailyPoints;

        if (dailyPoints > 0) {
          streakDays++;
        } else {
          streakDays = 0;
        }

        const date = new Date(dayStart).toISOString().split("T")[0];

        chartData.push({
          date,
          ecoScore: user.score.ecoScore + cumulativePoints,
          carbonSavedDaily: dailyCarbon,
          pointsDaily: dailyPoints,
          cumulativeCarbon,
          cumulativePoints,
          streakDays,
        });
      }

      return chartData;
    } catch (error) {
      logger.error("Failed to generate chart data", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Breakdown activities by category
   */
  private breakdownByCategory(activities: EcoActivity[]): CategoryBreakdown[] {
    const categories = new Map<
      string,
      {
        activityCount: number;
        totalCarbon: number;
        totalPoints: number;
        activities: EcoActivity[];
      }
    >();

    // Initialize categories
    ["food", "transport", "energy", "other"].forEach((cat) => {
      categories.set(cat, {
        activityCount: 0,
        totalCarbon: 0,
        totalPoints: 0,
        activities: [],
      });
    });

    // Aggregate activities
    activities.forEach((activity) => {
      const cat = activity.category || "other";
      const data = categories.get(cat) || categories.get("other");
      if (!data) {
        return;
      }
      data.activityCount++;
      data.totalCarbon += activity.carbonSaved || 0;
      data.totalPoints += activity.ecoPoints || 0;
      data.activities.push(activity);
    });

    const totalCarbon = Array.from(categories.values()).reduce((sum, c) => sum + c.totalCarbon, 0);

    // Format output
    const colors = {
      food: "#FF6B6B",
      transport: "#4ECDC4",
      energy: "#FFE66D",
      other: "#95E1D3",
    };

    return Array.from(categories.entries()).map(([category, data]) => {
      const trend = this.calculateCategoryTrend(data.activities);
      return {
        category: category as CategoryBreakdown["category"],
        name: category.charAt(0).toUpperCase() + category.slice(1),
        color: colors[category as keyof typeof colors],
        totalCarbon: data.totalCarbon,
        totalPoints: data.totalPoints,
        percentageOfTotal: totalCarbon > 0 ? (data.totalCarbon / totalCarbon) * 100 : 0,
        activityCount: data.activityCount,
        averagePointsPerActivity:
          data.activityCount > 0 ? data.totalPoints / data.activityCount : 0,
        averageCarbonPerActivity:
          data.activityCount > 0 ? data.totalCarbon / data.activityCount : 0,
        trend: trend.direction,
        trendChange: trend.change,
      };
    });
  }

  /**
   * Breakdown by day of week
   */
  private breakdownByDayOfWeek(activities: EcoActivity[]): VisualizationMetrics["byDayOfWeek"] {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayData = new Map<number, VisualizationMetrics["byDayOfWeek"][number]>();

    days.forEach((day, index) => {
      dayData.set(index, {
        day,
        activities: 0,
        carbon: 0,
        points: 0,
      });
    });

    activities.forEach((activity) => {
      const date = new Date(activity.createdAt);
      const dayOfWeek = date.getDay();
      const data = dayData.get(dayOfWeek)!;
      data.activities++;
      data.carbon += activity.carbonSaved || 0;
      data.points += activity.ecoPoints || 0;
    });

    return Array.from(dayData.values());
  }

  /**
   * Generate timeline for heatmap
   */
  private generateTimeline(
    activities: EcoActivity[],
    startDate: string,
    endDate: string
  ): TimelinePoint[] {
    const timeline: TimelinePoint[] = [];
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    for (let ms = startMs; ms <= endMs; ms += 24 * 60 * 60 * 1000) {
      const date = new Date(ms);
      const dateStr = date.toISOString().split("T")[0];
      const dayOfWeek = date.getDay();
      const week = Math.floor((ms - startMs) / (7 * 24 * 60 * 60 * 1000));
      const month = date.getMonth() + 1;

      const dayActivities = activities.filter(
        (a) => new Date(a.createdAt).toISOString().split("T")[0] === dateStr
      );

      const totalPoints = dayActivities.reduce((sum, a) => sum + (a.ecoPoints || 0), 0);
      const totalCarbon = dayActivities.reduce((sum, a) => sum + (a.carbonSaved || 0), 0);

      const intensity = Math.min(100, (totalPoints / 50) * 100);
      const intensityLevel =
        intensity === 0
          ? "none"
          : intensity < 20
            ? "low"
            : intensity < 40
              ? "medium"
              : intensity < 70
                ? "high"
                : "very_high";

      timeline.push({
        date: dateStr,
        dayOfWeek,
        week,
        month,
        activitiesLogged: dayActivities.length,
        totalPoints,
        totalCarbon,
        streakDay: dayActivities.length > 0,
        intensity,
        intensityLevel,
      });
    }

    return timeline;
  }

  /**
   * Get top activities
   */
  private getTopActivities(
    activities: EcoActivity[],
    limit: number
  ): VisualizationMetrics["topActivities"] {
    return activities
      .slice()
      .sort((a, b) => (b.carbonSaved || 0) - (a.carbonSaved || 0))
      .slice(0, limit)
      .map((a) => ({
        name: a.actionType,
        category: a.category,
        count: 1,
        totalCarbon: a.carbonSaved || 0,
        totalPoints: a.ecoPoints || 0,
      }));
  }

  /**
   * Generate insights
   */
  private generateInsights(
    activities: EcoActivity[],
    byCategory: CategoryBreakdown[]
  ): VisualizationMetrics["insights"] {
    const sorted = activities.slice().sort((a, b) => a.createdAt - b.createdAt);
    const bestDay = sorted.length > 0 ? new Date(sorted[0].createdAt).toLocaleDateString() : "N/A";
    const worstDay =
      sorted.length > 0
        ? new Date(sorted[sorted.length - 1].createdAt).toLocaleDateString()
        : "N/A";
    const mostProductive =
      byCategory.sort((a, b) => b.totalCarbon - a.totalCarbon)[0]?.category || "N/A";

    return {
      bestDay,
      worstDay,
      mostProductiveCategory: mostProductive,
      trend: activities.length > 5 ? "improving" : "stable",
      consistency: Math.min(100, (activities.length / 10) * 100),
    };
  }

  /**
   * Calculate category trend
   */
  private calculateCategoryTrend(activities: EcoActivity[]): {
    direction: "up" | "down" | "stable";
    change: number;
  } {
    if (activities.length < 2) {
      return { direction: "stable", change: 0 };
    }

    const firstHalf = activities.slice(0, Math.floor(activities.length / 2));
    const secondHalf = activities.slice(Math.floor(activities.length / 2));

    const firstAvg = firstHalf.reduce((sum, a) => sum + (a.ecoPoints || 0), 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, a) => sum + (a.ecoPoints || 0), 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    return {
      direction: change > 5 ? "up" : change < -5 ? "down" : "stable",
      change: Math.round(change),
    };
  }

  /**
   * Calculate metric
   */
  private calculateMetric(activities: EcoActivity[], metric: "carbon" | "points"): number {
    const field = metric === "carbon" ? "carbonSaved" : "ecoPoints";
    return activities.reduce((sum, a) => sum + (a[field] || 0), 0);
  }

  /**
   * Get date range
   */
  private getDateRange(period: string): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setFullYear(2000);
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  }

  /**
   * Get days difference
   */
  private getDaysDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
  }
}

export const visualizationService = new VisualizationService();
