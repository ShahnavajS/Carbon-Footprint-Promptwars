/**
 * GET /api/insights/latest
 * Returns the most recent cached insight for a user (no generation).
 *
 * Query params:
 *   - userId: string (required)
 *
 * Short-circuits to a seeded demo insight for the demo sentinel user.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import type { AiInsight } from "@/domain/insight/types";
import { adminDb } from "@/lib/firebase-admin";
import { logger } from "@/services/logger.service";
import { DEMO_UID, isDemoUid } from "@/config/constants";
import { parseQuery, internalError } from "@/lib/parse-request";

export const runtime = "nodejs";
export const maxDuration = 5;

// Demo insight uses the canonical AiInsight shape (note: `summary`, not `content`
// — the previous demo fixture used a `content` field that no consumer reads).
const DEMO_INSIGHT: AiInsight = {
  id: "demo-insight-latest",
  userId: DEMO_UID,
  weekStart: Date.now() - 7 * 24 * 60 * 60 * 1000,
  title: "Your Week's Impact",
  summary:
    "You had an inspiring week! By choosing low-impact transit, you spared the atmosphere a significant volume of greenhouse gases and watered your seedling.",
  biggestWin: "Metro riding saved carbon equivalent to a mature tree breathing for 15 days",
  improvementArea:
    "Your kitchen can be a place of climate healing. Try reducing energy use or switching to vegetarian swaps.",
  nextStep: "Prepare one fully plant-based vegan dinner",
  recommendations: [],
  generatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  viewed: false,
};

const LatestInsightQuerySchema = z.object({
  userId: z.string().min(1),
});

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
  const parsed = parseQuery(request, LatestInsightQuerySchema);
  if (!parsed.success) {
    return parsed.response;
  }
  const { userId } = parsed.data;

  try {
    if (isDemoUid(userId)) {
      return NextResponse.json(DEMO_INSIGHT, {
        headers: { "Cache-Control": "public, max-age=1800" },
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

    logger.info("Latest insight fetched", { userId, duration: Date.now() - startTime });

    return NextResponse.json(insight, {
      headers: { "Cache-Control": "private, max-age=1800" },
    });
  } catch (error) {
    logger.error("Latest insight fetch failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });

    return internalError("Failed to fetch insights");
  }
}
