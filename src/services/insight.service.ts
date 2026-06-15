import { gemini } from "./gemini";
import { GeminiInsightSchema, GeminiRecommendationsSchema } from "@/domain/insight/schemas";
import type { EcoActivity } from "@/domain/activity/types";
import type { EcoScoreUser } from "@/domain/user/types";
import type { AiInsight, AiRecommendation } from "@/domain/insight/types";
import { adminDb } from "@/lib/firebase-admin";
import { trackEvent } from "./analytics";

// ─── Prompt Builders ──────────────────────────────────────────────────────────

function buildInsightPrompt(user: EcoScoreUser, activities: EcoActivity[]): string {
  const weeklyStats = {
    totalActivities: activities.length,
    totalPoints: activities.reduce((s, a) => s + a.ecoPoints, 0),
    totalCarbonSaved: activities.reduce((s, a) => s + a.carbonSaved, 0).toFixed(2),
    byCategory: {
      food: activities.filter((a) => a.category === "food").length,
      transport: activities.filter((a) => a.category === "transport").length,
      energy: activities.filter((a) => a.category === "energy").length,
    },
    topAction:
      activities.length > 0
        ? activities.sort((a, b) => b.ecoPoints - a.ecoPoints)[0].actionType
        : "None",
  };

  return `You are a warm, supportive sustainability coach (in the style of Finch and Headspace). Write a weekly insight analyzing this user's activities.

User context:
- Name: ${user.profile.name}
- EcoScore: ${user.score.ecoScore}/1000 (Level ${user.score.level})
- Current streak: ${user.score.streak} days
- Diet preference: ${user.sustainability.dietType}
- Transport preference: ${user.sustainability.transportType}

This week's activity summary:
- Total eco-actions logged: ${weeklyStats.totalActivities}
- Total EcoPoints earned: ${weeklyStats.totalPoints}
- Total CO₂ saved: ${weeklyStats.totalCarbonSaved} kg
- Food actions: ${weeklyStats.byCategory.food}
- Transport actions: ${weeklyStats.byCategory.transport}
- Energy actions: ${weeklyStats.byCategory.energy}
- Best action this week: ${weeklyStats.topAction}

Guidelines:
1. Avoid presenting dry, raw statistics (e.g. 'You saved ${weeklyStats.totalCarbonSaved}kg'). Instead, convert these metrics into vivid physical analogies (e.g. charging a phone, running a fan/appliance, tree absorption days, or balloons of greenhouse gas).
2. Frame achievements around nurturing their virtual Terra Biome and protecting the living biosphere.
3. Be deeply personal, empathetic, and encouraging. Focus on the human narrative of their choices.

Return a JSON object with these exact keys:
- title: A warm, poetic, nature-inspired headline reflecting their week (max 80 chars)
- summary: 2 encouraging, story-driven sentences framing their week as a positive step for their biosphere (max 300 chars)
- biggestWin: One specific achievement translated into a real-world physical analogy (e.g., "Saves enough energy to run a fan for 50 hours") (max 200 chars)
- improvementArea: One gentle, non-judgmental suggestion focusing on a small area to nurture (max 200 chars)
- nextStep: One simple, immediately actionable next step (max 200 chars)`;
}

function buildRecommendationPrompt(user: EcoScoreUser, recentActivities: EcoActivity[]): string {
  const categoryCounts = {
    food: recentActivities.filter((a) => a.category === "food").length,
    transport: recentActivities.filter((a) => a.category === "transport").length,
    energy: recentActivities.filter((a) => a.category === "energy").length,
  };

  const goalsActive = Object.entries(user.goals)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ");

  return `You are a sustainability coach. Generate exactly 3 personalized eco-action recommendations.

User profile:
- EcoScore: ${user.score.ecoScore}/1000
- Diet: ${user.sustainability.dietType}
- Primary transport: ${user.sustainability.transportType}
- Home type: ${user.sustainability.homeType}
- Active goals: ${goalsActive || "none specified"}

Recent 2-week activity counts by category:
- Food actions: ${categoryCounts.food}
- Transport actions: ${categoryCounts.transport}
- Energy actions: ${categoryCounts.energy}

Rules:
1. Prioritize categories where the user has fewest actions (lowest count = most improvement potential)
2. Make actions specific and achievable within 1 week
3. estimatedCarbonSaved must be a realistic number in kg CO₂ (0.1–5.0 per action)
4. estimatedPoints must match the app's reward system (5–15 per action)

Return a JSON array of exactly 3 objects, each with:
- action: Specific action description (e.g., "Take the metro instead of driving 2 days this week")
- reason: Why this matters for this specific user (personalized, max 200 chars)
- category: one of "food", "transport", or "energy"
- estimatedCarbonSaved: kg CO₂ saved for one occurrence (number)
- estimatedPoints: EcoPoints awarded for one occurrence (integer)`;
}

// ─── Insight Service ──────────────────────────────────────────────────────────

export const InsightService = {
  /**
   * Generates a weekly AI insight for a user and persists it to Firestore.
   * Called by Cloud Functions every Monday or manually via API route.
   */
  async generateAndSaveWeeklyInsight(
    user: EcoScoreUser,
    weeklyActivities: EcoActivity[]
  ): Promise<AiInsight> {
    const db = adminDb;
    if (!db) {
      throw new Error("Firebase Admin is not initialized");
    }

    const prompt = buildInsightPrompt(user, weeklyActivities);

    // Call Gemini with structured JSON output
    const rawJson = await gemini.generateInsightJSON(prompt);

    // Validate with Zod — throws ZodError if Gemini returns malformed data
    const parsed = GeminiInsightSchema.parse(JSON.parse(rawJson));

    // Get week start (Monday 00:00:00 of current week)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const insight: Omit<AiInsight, "id"> = {
      userId: user.uid,
      weekStart: weekStart.getTime(),
      title: parsed.title,
      summary: parsed.summary,
      biggestWin: parsed.biggestWin,
      improvementArea: parsed.improvementArea,
      nextStep: parsed.nextStep,
      recommendations: [],
      generatedAt: Date.now(),
      viewed: false,
    };

    const insightRef = db.collection("insights").doc();
    await insightRef.set(insight);

    return {
      id: insightRef.id,
      ...insight,
    };
  },

  /**
   * Generates personalized recommendations and persists them to Firestore.
   * Called by Cloud Functions every Monday or manually via API route.
   */
  async generateAndSaveRecommendations(
    user: EcoScoreUser,
    recentActivities: EcoActivity[]
  ): Promise<AiRecommendation[]> {
    const db = adminDb;
    if (!db) {
      throw new Error("Firebase Admin is not initialized");
    }

    const prompt = buildRecommendationPrompt(user, recentActivities);
    const rawJson = await gemini.generateRecommendationsJSON(prompt);

    // Validate array response
    const parsed = GeminiRecommendationsSchema.parse(JSON.parse(rawJson));

    const recsToSave: Omit<AiRecommendation, "id">[] = parsed.slice(0, 3).map((item) => ({
      userId: user.uid,
      category: item.category,
      action: item.action,
      reason: item.reason,
      estimatedCarbonSaved: item.estimatedCarbonSaved,
      estimatedPoints: item.estimatedPoints,
      accepted: null,
      generatedAt: Date.now(),
    }));

    const saved = await Promise.all(
      recsToSave.map(async (recommendation) => {
        const recommendationRef = db.collection("recommendations").doc();
        await recommendationRef.set(recommendation);
        return {
          id: recommendationRef.id,
          ...recommendation,
        };
      })
    );

    trackEvent("recommendation_accepted", {
      userId: user.uid,
      recommendationId: "batch_generated",
      category: "all",
    });

    return saved;
  },
};

export default InsightService;
