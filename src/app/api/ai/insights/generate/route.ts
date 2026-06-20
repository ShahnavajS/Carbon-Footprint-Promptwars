/**
 * POST /api/ai/insights/generate
 * Generates AI insights + recommendations for the authenticated user.
 *
 * Behavior:
 *   - Demo sentinel user → instant seeded fixture (no Firebase / Gemini calls).
 *   - Real user → loads profile + recent activities, generates insight and
 *     recommendations in parallel, with a 20s timeout.
 *
 * On any failure during generation we return HTTP 200 with a `degraded: true`
 * flag plus seeded fallback recommendations (rather than a misleading 2xx-as-
 * error), so the UI can render something useful while keeping the contract
 * honest: a 5xx would mean the endpoint itself is broken, which it isn't.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { InsightService } from "@/services/insight.service";
import type { EcoActivity } from "@/domain/activity/types";
import type { EcoScoreUser } from "@/domain/user/types";
import { adminDb } from "@/lib/firebase-admin";
import { logger } from "@/services/logger.service";
import { isDemoUid } from "@/config/constants";
import { parseJsonBody, internalError } from "@/lib/parse-request";

export const runtime = "nodejs";
export const maxDuration = 30;

// Fallback recommendations returned when Gemini generation is unavailable so
// the UI is never empty. These intentionally use the production schema
// ({ action, reason, estimatedCarbonSaved, estimatedPoints }).
const FALLBACK_RECOMMENDATIONS = [
  {
    id: "fallback-1",
    userId: "",
    category: "food" as const,
    action: "Try one fully plant-based dinner",
    reason: "Plant-based meals are among the highest-leverage food swaps for carbon.",
    estimatedCarbonSaved: 1.0,
    estimatedPoints: 15,
    accepted: null,
    generatedAt: Date.now(),
  },
  {
    id: "fallback-2",
    userId: "",
    category: "transport" as const,
    action: "Take the metro once this week",
    reason: "Swapping a car trip for transit multiplies your transport savings.",
    estimatedCarbonSaved: 1.2,
    estimatedPoints: 15,
    accepted: null,
    generatedAt: Date.now(),
  },
  {
    id: "fallback-3",
    userId: "",
    category: "energy" as const,
    action: "Line-dry one load of laundry",
    reason: "Skipping the dryer is a simple, high-impact energy habit.",
    estimatedCarbonSaved: 0.8,
    estimatedPoints: 10,
    accepted: null,
    generatedAt: Date.now(),
  },
];

const GenerateInsightBodySchema = z.object({
  userId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  const parsed = await parseJsonBody(request, GenerateInsightBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }
  const { userId } = parsed.data;

  try {
    if (isDemoUid(userId)) {
      logger.info("Insights generation (demo mode)", {
        userId,
        duration: Date.now() - startTime,
      });
      return NextResponse.json(
        { insight: null, recommendations: FALLBACK_RECOMMENDATIONS, demo: true },
        { headers: { "Cache-Control": "public, max-age=3600" } }
      );
    }

    if (!adminDb) {
      throw new Error("Firebase Admin is not initialized");
    }

    // Fetch user profile and activities with a timeout to prevent hanging.
    const dataPromise = Promise.all([
      adminDb.collection("users").doc(userId).get(),
      adminDb
        .collection("activities")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(30)
        .get(),
    ]);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Generation timed out")), 20000)
    );

    let userSnapshot: FirebaseFirestore.DocumentSnapshot;
    let activitiesSnapshot: FirebaseFirestore.QuerySnapshot;
    try {
      [userSnapshot, activitiesSnapshot] = (await Promise.race([dataPromise, timeoutPromise])) as [
        FirebaseFirestore.DocumentSnapshot,
        FirebaseFirestore.QuerySnapshot,
      ];
    } catch {
      logger.warn("Insights generation timed out", {
        userId,
        duration: Date.now() - startTime,
      });
      return NextResponse.json(
        {
          insight: null,
          recommendations: FALLBACK_RECOMMENDATIONS,
          degraded: true,
          message: "Generation is taking longer than expected. Showing fallback actions.",
        },
        { status: 200 }
      );
    }

    if (!userSnapshot.exists) {
      logger.warn("User not found for insights", { userId });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = { uid: userId, ...userSnapshot.data() } as EcoScoreUser;
    const allActivities = activitiesSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as EcoActivity
    );

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyActivities = allActivities.filter((a) => a.createdAt >= oneWeekAgo);

    try {
      const [insight, recommendations] = await Promise.all([
        InsightService.generateAndSaveWeeklyInsight(user, weeklyActivities),
        InsightService.generateAndSaveRecommendations(user, allActivities.slice(0, 20)),
      ]);

      logger.info("Insights generated successfully", {
        userId,
        duration: Date.now() - startTime,
        activitiesProcessed: weeklyActivities.length,
      });

      return NextResponse.json(
        { insight, recommendations },
        { headers: { "Cache-Control": "private, max-age=1800" } }
      );
    } catch (error) {
      logger.warn("Insight generation failed; returning fallback", {
        userId,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
      return NextResponse.json(
        {
          insight: null,
          recommendations: FALLBACK_RECOMMENDATIONS,
          degraded: true,
          message: "Could not generate a personalized reflection yet. Here are suggested actions.",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    logger.error("Insights generation failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });

    return internalError("Failed to generate insights");
  }
}
