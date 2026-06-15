/**
 * Report Card Service
 * Business logic for monthly report card generation and management
 */

import { Firestore } from "firebase/firestore";
import { ReportCardRepository } from "@/repositories/report-card.repository";
import { ActivityRepository } from "@/repositories/activity.repository";
import { MonthlyReportCard, Achievement } from "@/domain/report-card/types";
import type { EcoActivity } from "@/domain/activity/types";

export class ReportCardService {
  private reportRepo: ReportCardRepository;

  constructor(db: Firestore) {
    this.reportRepo = new ReportCardRepository(db);
  }

  /**
   * Generate monthly report for user
   */
  async generateMonthlyReport(
    userId: string,
    year: number,
    month: number,
    currentEcoScore: number,
    previousMonthScore: number = 0
  ): Promise<MonthlyReportCard> {
    try {
      // Get all activities for the month
      const activities = await ActivityRepository.getRecentActivities(userId, 1000);

      // Filter activities for this month
      const monthStart = new Date(year, month - 1, 1).getTime();
      const monthEnd = new Date(year, month, 0, 23, 59, 59).getTime();

      const monthlyActivities = activities.filter(
        (a: EcoActivity) => a.createdAt >= monthStart && a.createdAt <= monthEnd
      );

      // Calculate stats
      const totalCarbonSaved = monthlyActivities.reduce(
        (sum: number, a: EcoActivity) => sum + (a.carbonSaved || 0),
        0
      );

      // Determine best category
      const categoryStats: Record<string, number> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      monthlyActivities.forEach((a: any) => {
        const category = a.category as string;
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });

      const bestCategory =
        (Object.entries(categoryStats).sort(([, a], [, b]) => b - a)[0]?.[0] as
          | "food"
          | "transport"
          | "energy"
          | null) || null;

      // Determine best habit (most logged action type)
      const habitStats: Record<string, number> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      monthlyActivities.forEach((a: any) => {
        habitStats[a.type] = (habitStats[a.type] || 0) + 1;
      });

      const bestHabit = Object.entries(habitStats).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

      // Create achievements list (placeholder - actual achievement logic in BadgeService)
      const achievements: Achievement[] = [];

      // Create report card
      const reportCard: Omit<MonthlyReportCard, "id"> = {
        userId,
        year,
        month,
        ecoScore: currentEcoScore,
        ecoScoreChange: currentEcoScore - previousMonthScore,
        carbonSaved: Math.round(totalCarbonSaved * 10) / 10, // Round to 1 decimal
        carbonSavedChange: 0, // Would compare to previous month
        currentStreak: 0, // Get from user profile
        bestStreak: 0, // Get from user profile
        bestHabit,
        bestCategory,
        achievements,
        communityRanking: null, // Get from leaderboard
        generatedAt: Date.now(),
      };

      return await this.reportRepo.create(reportCard);
    } catch (error) {
      throw new Error(`Failed to generate monthly report: ${error}`);
    }
  }

  /**
   * Get latest report for user
   */
  async getLatestReport(userId: string): Promise<MonthlyReportCard | null> {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      return await this.reportRepo.getLatestByMonth(userId, year, month);
    } catch (error) {
      throw new Error(`Failed to get latest report: ${error}`);
    }
  }

  /**
   * Get report for specific month
   */
  async getMonthReport(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyReportCard | null> {
    try {
      return await this.reportRepo.getLatestByMonth(userId, year, month);
    } catch (error) {
      throw new Error(`Failed to get month report: ${error}`);
    }
  }

  /**
   * Get all reports for user with pagination
   */
  async getUserReports(
    userId: string,
    limit: number = 12,
    offset: number = 0
  ): Promise<MonthlyReportCard[]> {
    try {
      return await this.reportRepo.getUserReports(userId, limit, offset);
    } catch (error) {
      throw new Error(`Failed to get user reports: ${error}`);
    }
  }

  /**
   * Track report view
   */
  async trackView(reportId: string): Promise<void> {
    try {
      await this.reportRepo.markAsViewed(reportId);
    } catch (error) {
      throw new Error(`Failed to track view: ${error}`);
    }
  }

  /**
   * Track report share
   */
  async trackShare(reportId: string): Promise<void> {
    try {
      await this.reportRepo.recordShare(reportId);
    } catch (error) {
      throw new Error(`Failed to track share: ${error}`);
    }
  }

  /**
   * Generate report cards for all users (scheduled Cloud Function)
   */
  async generateMonthlyReportsForAllUsers(): Promise<{ successful: number; failed: number }> {
    // This would be called from a Cloud Function at month end
    // Implementation depends on getting all users and their current stats
    return { successful: 0, failed: 0 };
  }
}
