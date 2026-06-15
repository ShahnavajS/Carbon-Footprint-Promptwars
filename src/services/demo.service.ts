/**
 * Demo Service
 *
 * Manages demo user creation, data seeding, and feature exploration
 */

import { EcoScoreUser } from "@/domain/user/types";
import { demoRepository } from "@/repositories/demo.repository";
import type { DemoSeedRecord } from "@/repositories/demo.repository";
import { twinRepository } from "@/repositories/twin.repository";
import { forecastRepository } from "@/repositories/forecast.repository";
import { logger } from "@/services/logger.service";
import { SustainabilityTwin } from "@/domain/twin/types";
import { ImpactForecast } from "@/domain/forecast/types";

export class DemoService {
  private DEMO_UID = "test-eco-user-id";
  private DEMO_EMAIL = "test@ecoscore.com";
  private DEMO_NAME = "Test Eco User";

  /**
   * Initialize complete demo user with all data
   */
  async initializeDemoUser(): Promise<{ uid: string; email: string; password: string }> {
    try {
      // Create base user profile
      const demoUser: EcoScoreUser = this.createDemoProfile();

      // Save to repository
      await demoRepository.createDemoUser(demoUser);

      // Populate demo data
      await this.populateDemoData(this.DEMO_UID);

      logger.info("Demo user initialized", {
        userId: this.DEMO_UID,
        email: this.DEMO_EMAIL,
      });

      return {
        uid: this.DEMO_UID,
        email: this.DEMO_EMAIL,
        password: "demo123456", // Hardcoded for demo
      };
    } catch (error) {
      logger.error("Failed to initialize demo user", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Populate demo data for all features
   */
  private async populateDemoData(userId: string): Promise<void> {
    try {
      // Generate demo twin
      const demoTwin = this.createDemoTwin(userId);
      await twinRepository.saveTwin(userId, demoTwin);

      // Generate demo forecasts
      const forecast30d = this.createDemoForecast(userId, "30d");
      const forecast90d = this.createDemoForecast(userId, "90d");
      const forecast180d = this.createDemoForecast(userId, "180d");

      await forecastRepository.saveForecast(userId, forecast30d);
      await forecastRepository.saveForecast(userId, forecast90d);
      await forecastRepository.saveForecast(userId, forecast180d);

      // Populate activities
      const demoActivities = this.generateDemoActivities();
      await demoRepository.populateDemoActivities(userId, demoActivities);

      // Populate badges
      const demoBadges = this.generateDemoBadges();
      await demoRepository.populateDemoBadges(userId, demoBadges);

      // Populate challenges
      const demoChallenges = this.generateDemoChallenges();
      await demoRepository.populateDemoChallenges(userId, demoChallenges);

      logger.info("Demo data populated", { userId });
    } catch (error) {
      logger.error("Failed to populate demo data", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create demo user profile
   */
  private createDemoProfile(): EcoScoreUser {
    return {
      uid: this.DEMO_UID,
      profile: {
        name: this.DEMO_NAME,
        email: this.DEMO_EMAIL,
        avatar: null,
        city: "San Francisco",
        country: "United States",
        language: "en",
      },
      score: {
        ecoScore: 580,
        level: 3,
        streak: 5,
        bestStreak: 15,
        carbonSaved: 250,
      },
      sustainability: {
        dietType: "vegetarian",
        transportType: "metro",
        homeType: "apartment",
      },
      goals: {
        reduceTransport: true,
        reduceFood: true,
        reduceEnergy: false,
        buildHabits: true,
        learnSustainability: true,
      },
      metadata: {
        createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days ago
        updatedAt: Date.now(),
      },
    };
  }

  /**
   * Create demo twin profile
   */
  private createDemoTwin(userId: string): SustainabilityTwin {
    return {
      uid: userId,
      generatedAt: Date.now(),
      level: "advocate",
      ecoScore: 580,

      strengths: [
        {
          area: "Transportation",
          description: "Consistently uses public transit and bikes for local commutes",
          impact: "Avoiding 5-7 tons of CO2 annually compared to driving",
          score: 95,
          evidence: [
            "120 transit rides in 45 days",
            "Weekly cycling habit",
            "Zero personal car use",
          ],
        },
        {
          area: "Food Choices",
          description: "Vegetarian diet significantly reduces food-related carbon",
          impact: "50% lower food carbon footprint than average",
          score: 88,
          evidence: ["Plant-based diet", "Local grocery shopping", "Minimal food waste"],
        },
      ],

      weaknesses: [
        {
          area: "Energy Consumption",
          description: "Higher than average home energy usage",
          recommendation: "Install LED lighting and optimize heating/cooling schedules",
          potentialGain: 100,
          actionItems: ["Switch to LED bulbs", "Use smart thermostat", "Unplug standby devices"],
        },
        {
          area: "Clothing & Shopping",
          description: "Occasional fast fashion purchases",
          recommendation: "Buy secondhand or high-quality items that last longer",
          potentialGain: 75,
          actionItems: [
            "Shop vintage first",
            "Support sustainable brands",
            "Repair instead of replace",
          ],
        },
      ],

      monthlyFocus: {
        area: "Home Energy Efficiency",
        actionItems: [
          "Audit current lighting and replace with LEDs",
          "Set thermostat to 68°F in winter, 76°F in summer",
          "Unplug devices when not in use",
        ],
        estimatedImpact: "20-30 kg CO2 savings per month",
        estimatedPointGain: 150,
        difficulty: "easy",
      },

      predictedProgress: [
        {
          weeks: 4,
          estimatedScore: 650,
          confidence: 85,
          methodology: "Historical trend analysis with energy efficiency focus",
        },
        {
          weeks: 12,
          estimatedScore: 800,
          confidence: 75,
          methodology: "Cumulative impact of energy + shopping improvements",
        },
      ],

      nextRegenerationAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      generationPromptVersion: "v1.0",

      metadata: {
        analyzedActivityCount: 145,
        averageDailyPoints: 12.9,
        streakDays: 15,
      },
    };
  }

  /**
   * Create demo forecasts
   */
  private createDemoForecast(userId: string, period: "30d" | "90d" | "180d"): ImpactForecast {
    const daysMap = { "30d": 30, "90d": 90, "180d": 180 };
    const days = daysMap[period];

    const predictions = [];
    let cumulativeCarbon = 0;
    let cumulativePoints = 0;

    for (let i = 1; i <= days; i++) {
      const dailyCarbon = 2.1 + Math.random() * 0.5;
      const dailyPoints = 10 + Math.random() * 5;
      cumulativeCarbon += dailyCarbon;
      cumulativePoints += dailyPoints;

      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);

      predictions.push({
        date: date.toISOString(),
        ecoScore: 580 + cumulativePoints,
        carbonSaved: dailyCarbon,
        carbonSavedCumulative: cumulativeCarbon,
        pointsEarned: dailyPoints,
        pointsEarnedCumulative: cumulativePoints,
        levelProgress: ((cumulativePoints % 100) / 100) * 100,
        habits: ["Daily Track", "Weekly Goal"],
      });
    }

    return {
      uid: userId,
      generatedAt: Date.now(),
      period,
      scenarios: [
        {
          scenario: "current",
          description: "Maintaining current activity",
          assumptions: ["No behavior changes"],
          predictions,
          summaryMetrics: {
            totalCarbonSaved: cumulativeCarbon,
            totalPointsEarned: cumulativePoints,
            levelGain: Math.floor(cumulativePoints / 100),
            probabilityOfAchievement: 75,
          },
        },
        {
          scenario: "optimistic",
          description: "Increasing activity by 50%",
          assumptions: ["Adopting new habits"],
          predictions: predictions.map((p) => ({
            ...p,
            carbonSavedCumulative: p.carbonSavedCumulative * 1.5,
            pointsEarnedCumulative: p.pointsEarnedCumulative * 1.5,
          })),
          summaryMetrics: {
            totalCarbonSaved: cumulativeCarbon * 1.5,
            totalPointsEarned: cumulativePoints * 1.5,
            levelGain: Math.floor((cumulativePoints * 1.5) / 100),
            probabilityOfAchievement: 45,
          },
        },
      ],
      baselinePredictions: predictions,
      confidence: 82,
      confidenceFactors: {
        activityHistoryDepth: "rich",
        trendConsistency: 85,
        dataAvailability: 95,
      },
      methodology: "ML-based trend extrapolation",
      modelVersion: "v1.0",
      keyInsights: {
        strongest_period: "Mid-period",
        critical_milestone: "800 eco-score point level",
        recommended_action: "Focus on energy efficiency this month",
      },
      nextRegenerationAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
  }

  /**
   * Generate demo activities
   */
  private generateDemoActivities(): DemoSeedRecord[] {
    return [
      {
        id: "demo-activity-1",
        type: "Bike Commute",
        category: "transport",
        carbonReduction: 5.2,
        ecoPoints: 25,
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
      },
      {
        id: "demo-activity-2",
        type: "Public Transit",
        category: "transport",
        carbonReduction: 3.1,
        ecoPoints: 20,
        timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000,
      },
      {
        id: "demo-activity-3",
        type: "Vegetarian Meal",
        category: "food",
        carbonReduction: 2.5,
        ecoPoints: 15,
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
      },
      {
        id: "demo-activity-4",
        type: "LED Lights",
        category: "energy",
        carbonReduction: 1.8,
        ecoPoints: 18,
        timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
      },
    ];
  }

  /**
   * Generate demo badges
   */
  private generateDemoBadges(): DemoSeedRecord[] {
    return [
      {
        id: "badge-transit-master",
        name: "Transit Master",
        description: "Used public transit 50+ times",
        icon: "🚌",
        earnedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
        level: 2,
      },
      {
        id: "badge-green-eater",
        name: "Green Eater",
        description: "Vegetarian for 30+ days",
        icon: "🥗",
        earnedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        level: 1,
      },
      {
        id: "badge-eco-streak",
        name: "Eco Streak",
        description: "15-day activity streak",
        icon: "🔥",
        earnedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        level: 1,
      },
    ];
  }

  /**
   * Generate demo challenges
   */
  private generateDemoChallenges(): DemoSeedRecord[] {
    return [
      {
        id: "challenge-1",
        title: "Zero Waste Week",
        description: "Produce minimal waste for 7 days",
        status: "completed",
        progress: 100,
        completedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        reward: 100,
      },
      {
        id: "challenge-2",
        title: "Car-Free Month",
        description: "Don't use a personal car for 30 days",
        status: "in_progress",
        progress: 75,
        daysRemaining: 7,
        reward: 250,
      },
    ];
  }
}

export const demoService = new DemoService();
