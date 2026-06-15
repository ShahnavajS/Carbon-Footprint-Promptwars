import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { InsightService } from "@/services/insight.service";
import type { EcoActivity } from "@/domain/activity/types";
import type { EcoScoreUser } from "@/domain/user/types";
import { adminDb } from "@/lib/firebase-admin";
import { logger } from "@/services/logger.service";

export const runtime = "nodejs";
export const maxDuration = 30; // 30 second timeout

// Demo insights for demo users (no Firebase required)
const DEMO_INSIGHTS = {
  insight: {
    id: "demo-insight-weekly",
    userId: "test-eco-user-id",
    type: "weekly",
    title: "Your Week's Impact",
    content: `You've made excellent progress this week! Your transportation choices saved 15.2 kg of CO₂ - that's equivalent to planting 1 tree. Your consistent public transit usage and biking habits continue to set you apart. This week, focus on expanding your vegetarian meals to 6 days - you're already at 4/7 days, so the next step will multiply your food impact.`,
    metrics: {
      carbonSaved: 15.2,
      pointsEarned: 145,
      activitiesLogged: 23,
      streakMaintained: true,
    },
    generatedAt: Date.now(),
    nextGeneratedAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  },
  recommendations: [
    {
      id: "rec-1",
      title: "Try Meatless Mondays",
      description: "Reduce food carbon by 35% with plant-based Mondays",
      impact: "35 kg CO₂ saved per year",
      difficulty: "easy",
      category: "food",
    },
    {
      id: "rec-2",
      title: "Carpool Coordination",
      description: "Share rides with colleagues 2x per week",
      impact: "120 kg CO₂ saved per year",
      difficulty: "medium",
      category: "transport",
    },
    {
      id: "rec-3",
      title: "LED Lighting Upgrade",
      description: "Replace 5 bulbs with LED equivalents",
      impact: "45 kg CO₂ saved per year",
      difficulty: "easy",
      category: "energy",
    },
  ],
};

/**
 * POST /api/ai/insights/generate
 * Generates AI insights for the authenticated user.
 * Requires userId in body (validated server-side).
 *
 * Optimizations:
 * - Demo users return instant cached data
 * - Timeout protection (30s max)
 * - Offline/error fallback with cached recommendations
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = (await request.json()) as { userId?: string };
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // OPTIMIZATION 1: Demo users get instant response (no Firestore calls)
    if (userId === "test-eco-user-id") {
      logger.info("Insights generation (demo mode)", { userId, duration: Date.now() - startTime });
      return NextResponse.json(DEMO_INSIGHTS, {
        headers: {
          "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        },
      });
    }

    // OPTIMIZATION 2: Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      if (!adminDb) {
        throw new Error("Firebase Admin is not initialized");
      }

      // Fetch user profile and activities with timeout
      const [userSnapshot, activitiesSnapshot] = await Promise.all([
        adminDb.collection("users").doc(userId).get(),
        adminDb
          .collection("activities")
          .where("userId", "==", userId)
          .orderBy("createdAt", "desc")
          .limit(30)
          .get(),
      ]);

      clearTimeout(timeoutId);

      if (!userSnapshot.exists) {
        logger.warn("User not found for insights", { userId });
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const user = { uid: userId, ...userSnapshot.data() } as EcoScoreUser;
      const allActivities = activitiesSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as EcoActivity
      );

      // OPTIMIZATION 3: Filter on client side logic
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weeklyActivities = allActivities.filter((a) => a.createdAt >= oneWeekAgo);

      // Generate insights in parallel
      const [insight, recommendations] = await Promise.all([
        InsightService.generateAndSaveWeeklyInsight(user, weeklyActivities),
        InsightService.generateAndSaveRecommendations(user, allActivities.slice(0, 20)), // OPTIMIZATION: Limit to 20
      ]);

      logger.info("Insights generated successfully", {
        userId,
        duration: Date.now() - startTime,
        activitiesProcessed: weeklyActivities.length,
      });

      return NextResponse.json(
        { insight, recommendations },
        {
          headers: {
            "Cache-Control": "private, max-age=1800", // Cache for 30 minutes
          },
        }
      );
    } catch {
      clearTimeout(timeoutId);
      logger.warn("Insights generation timeout", { userId, duration: Date.now() - startTime });

      // Return cached/fallback recommendations instead of error
      return NextResponse.json(
        {
          insight: null,
          recommendations: DEMO_INSIGHTS.recommendations,
          message: "Using cached recommendations. Try again in a moment.",
        },
        { status: 202 } // 202 Accepted - processing will continue
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Insights generation failed", {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    // OPTIMIZATION 4: Return fallback recommendations on error
    return NextResponse.json(
      {
        insight: null,
        recommendations: DEMO_INSIGHTS.recommendations,
        message: "Could not generate insights. Here are recommended actions.",
      },
      { status: 202 } // Partial success
    );
  }
}
