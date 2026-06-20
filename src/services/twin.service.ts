/**
 * Sustainability Twin Service
 *
 * Generates personalized AI-powered sustainability profiles
 * using Gemini and user activity history
 */

import { SustainabilityTwin, TwinGenerationData } from "@/domain/twin/types";
import { twinRepository } from "@/repositories/twin.repository";
import { userRepository } from "@/repositories/user.repository";
import { activityRepository } from "@/repositories/activity.repository";
import { gemini } from "@/services/gemini";
import { logger } from "@/services/logger.service";
import { rateLimit } from "@/lib/rate-limiter";
import { getEcoTier } from "@/domain/eco-score/levels";

interface TwinGenerationResponse {
  strengths?: SustainabilityTwin["strengths"];
  weaknesses?: SustainabilityTwin["weaknesses"];
  monthlyFocus?: SustainabilityTwin["monthlyFocus"];
  predictedProgress?: SustainabilityTwin["predictedProgress"];
}

export class TwinService {
  /**
   * Get current twin or regenerate if needed
   */
  async getTwin(userId: string): Promise<SustainabilityTwin | null> {
    try {
      const existing = await twinRepository.getTwin(userId);

      if (existing && Date.now() < existing.nextRegenerationAt) {
        return existing;
      }

      // Regenerate if needed
      if (!existing || Date.now() >= existing.nextRegenerationAt) {
        return await this.generateTwin(userId);
      }

      return existing;
    } catch (error) {
      logger.error("Failed to get twin", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Generate new twin profile using Gemini
   */
  async generateTwin(userId: string): Promise<SustainabilityTwin> {
    try {
      // Rate limiting
      await rateLimit("AI", userId);

      // Gather user data
      const data = await this.gatherTwinGenerationData(userId);

      // Build Gemini prompt
      const prompt = this.buildTwinPrompt(data);

      // Call Gemini
      const response = (await gemini.generateJSON(prompt, {
        temperature: 0.7,
        maxTokens: 2000,
      })) as TwinGenerationResponse;

      // Parse response
      const twin: SustainabilityTwin = {
        uid: userId,
        generatedAt: Date.now(),
        level: data.level as SustainabilityTwin["level"],
        ecoScore: data.currentScore,

        strengths: response.strengths || [],
        weaknesses: response.weaknesses || [],

        monthlyFocus: response.monthlyFocus || {
          area: "Sustainable Living",
          actionItems: ["Start tracking more activities"],
          estimatedImpact: "10-15 eco-score points",
          estimatedPointGain: 10,
          difficulty: "easy" as const,
        },

        predictedProgress: response.predictedProgress || [
          {
            weeks: 4,
            estimatedScore: data.currentScore + 50,
            confidence: 75,
            methodology: "Historical trend analysis",
          },
        ],

        nextRegenerationAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week
        generationPromptVersion: "v1.0",

        metadata: {
          analyzedActivityCount: data.recentActivities.length,
          averageDailyPoints: data.currentScore / 30, // Rough estimate
          streakDays: data.streak,
        },
      };

      // Save to Firestore
      await twinRepository.saveTwin(userId, twin);

      logger.info("Twin profile generated", {
        userId,
        level: twin.level,
        ecoScore: twin.ecoScore,
      });

      return twin;
    } catch (error) {
      logger.error("Failed to generate twin", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Gather data for twin generation
   */
  private async gatherTwinGenerationData(userId: string): Promise<TwinGenerationData> {
    const user = await userRepository.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get recent activities (last 30 days)
    const activities = await activityRepository.getActivities(
      userId,
      Date.now() - 30 * 24 * 60 * 60 * 1000,
      Date.now()
    );

    // Determine level
    const level = this.calculateLevel(user.score.ecoScore);

    return {
      userId,
      currentScore: user.score.ecoScore,
      level,
      recentActivities: activities.map((a) => ({
        category: a.category,
        type: a.actionType,
        points: a.ecoPoints || 0,
        timestamp: a.createdAt,
      })),
      preferences: {
        dietType: user.sustainability?.dietType || "unknown",
        transportType: user.sustainability?.transportType || "unknown",
        homeType: user.sustainability?.homeType || "unknown",
      },
      streak: user.score.streak || 0,
      totalPoints: user.score.ecoScore,
    };
  }

  /**
   * Build Gemini prompt for twin generation
   */
  private buildTwinPrompt(data: TwinGenerationData): string {
    const activitySummary = this.summarizeActivities(data.recentActivities);

    return `You are an AI sustainability coach. Analyze this user's sustainability profile and generate personalized insights.

User Profile:
- Eco-Score: ${data.currentScore}
- Level: ${data.level}
- Current Streak: ${data.streak} days
- Recent Activities: ${activitySummary}

Preferences:
- Diet: ${data.preferences.dietType}
- Transport: ${data.preferences.transportType}
- Home: ${data.preferences.homeType}

Generate a JSON response with:
{
  "strengths": [
    {
      "area": "string",
      "description": "string (why they're strong)",
      "impact": "string (the positive impact)",
      "score": number (0-100),
      "evidence": ["string", ...]
    }
  ],
  "weaknesses": [
    {
      "area": "string",
      "description": "string (why they're weak)",
      "recommendation": "string",
      "potentialGain": number,
      "actionItems": ["string", ...]
    }
  ],
  "monthlyFocus": {
    "area": "string",
    "actionItems": ["string", ...],
    "estimatedImpact": "string",
    "estimatedPointGain": number,
    "difficulty": "easy|medium|hard"
  },
  "predictedProgress": [
    {
      "weeks": number,
      "estimatedScore": number,
      "confidence": number (0-100),
      "methodology": "string"
    }
  ]
}

Be encouraging, specific, and actionable.`;
  }

  /**
   * Summarize activities for prompt
   */
  private summarizeActivities(activities: TwinGenerationData["recentActivities"]): string {
    const categories = new Map<string, number>();

    activities.forEach((a) => {
      categories.set(a.category, (categories.get(a.category) || 0) + 1);
    });

    const summary = Array.from(categories.entries())
      .map(([cat, count]) => `${count} ${cat} activities`)
      .join(", ");

    return summary || "No recent activities";
  }

  /**
   * Determine level tier based on eco-score (delegates to the unified config).
   */
  private calculateLevel(ecoScore: number): string {
    return getEcoTier(ecoScore);
  }
}

export const twinService = new TwinService();
