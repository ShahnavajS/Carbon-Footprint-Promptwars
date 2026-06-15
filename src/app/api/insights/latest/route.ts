/**
 * GET /api/insights/latest
 * Get latest cached insight (no generation)
 * Query params:
 *   - userId: string (required)
 *
 * Returns: Latest insight from cache
 * Cache: 30 minutes
 * Performance: ~50ms (no AI call)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { AiInsight } from "@/domain/insight/types";
import { adminDb } from "@/lib/firebase-admin";
import { logger } from "@/services/logger.service";

export const runtime = "nodejs";
export const maxDuration = 5;

const DEMO_INSIGHT = {
  id: "demo-insight-latest",
  userId: "test-eco-user-id",
  type: "weekly",
  title: "Your Week's Impact",
  content:
    "You've made excellent progress this week! Your transportation choices saved 15.2 kg of CO2 - that's equivalent to planting 1 tree. This week, focus on expanding your vegetarian meals to 6 days.",
  metrics: {
    carbonSaved: 15.2,
    pointsEarned: 145,
    activitiesLogged: 23,
    streakMaintained: true,
  },
  generatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  nextGeneratedAt: Date.now() + 5 * 24 * 60 * 60 * 1000,
};

function toAiInsight(id: string, data: FirebaseFirestore.DocumentData): AiInsight {
  return {
    id,
    userId: data.userId,
    weekStart: data.weekStart,
    title: data.title,
    summary: data.summary,
    biggestWin: data.biggestWin,
    improvementArea: data.improvementArea,
    nextStep: data.nextStep,
    recommendations: data.recommendations ?? [],
    generatedAt: data.generatedAt,
    viewed: data.viewed ?? false,
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);

  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    if (userId === "test-eco-user-id") {
      return NextResponse.json(DEMO_INSIGHT, {
        headers: {
          "Cache-Control": "public, max-age=1800",
        },
      });
    }

    if (!adminDb) {
      throw new Error("Firebase Admin is not initialized");
    }

    const snapshot = await adminDb
      .collection("insights")
      .where("userId", "==", userId)
      .orderBy("generatedAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { data: null, message: "No insights available. Generate one first." },
        { status: 200 }
      );
    }

    const latest = snapshot.docs[0];
    const insight = toAiInsight(latest.id, latest.data());

    logger.info("Latest insight fetched", {
      userId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(insight, {
      headers: {
        "Cache-Control": "private, max-age=1800",
      },
    });
  } catch (error) {
    logger.error("Latest insight fetch failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });

    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
  }
}
