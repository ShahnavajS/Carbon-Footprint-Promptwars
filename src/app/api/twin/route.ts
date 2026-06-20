/**
 * GET /api/twin?userId=...
 * Returns the user's Sustainability Twin (AI-generated profile with strengths,
 * weaknesses, monthly focus, and future-score projection).
 *
 * Demo sentinel user → seeded fixture twin (no Gemini/Firestore call).
 * Real user → delegates to TwinService.getTwin, with a graceful fallback.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { logger } from "@/services/logger.service";
import { isDemoUid } from "@/config/constants";
import { parseQuery } from "@/lib/parse-request";
import type { SustainabilityTwin } from "@/domain/twin/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const TwinQuerySchema = z.object({
  userId: z.string().min(1),
});

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** Seeded twin so the demo path renders richly without a Gemini call. */
function demoTwin(): SustainabilityTwin {
  const now = Date.now();
  return {
    uid: "demo",
    generatedAt: now - 2 * WEEK,
    level: "explorer",
    ecoScore: 580,
    strengths: [
      {
        area: "Transportation",
        description: "You consistently choose low-carbon transit.",
        impact: "Your metro and cycling habits are your biggest carbon lever.",
        score: 82,
        evidence: ["Frequent Metro logs", "Regular cycling commutes"],
      },
      {
        area: "Food choices",
        description: "A plant-leaning diet keeps your food footprint low.",
        impact: "Vegetarian meals reduce your single-meal emissions meaningfully.",
        score: 71,
        evidence: ["Regular Vegetarian Meal logs"],
      },
    ],
    weaknesses: [
      {
        area: "Household energy",
        description: "Energy-saving habits are underused.",
        recommendation: "Line-drying and reducing AC usage are easy wins.",
        potentialGain: 60,
        actionItems: ["Line-dry one laundry load this week", "Raise AC temperature by 1°C"],
      },
    ],
    monthlyFocus: {
      area: "Home energy efficiency",
      actionItems: ["Line-dry laundry", "Switch off idle appliances"],
      estimatedImpact: "~3–5 kg CO₂ / week",
      estimatedPointGain: 40,
      difficulty: "easy",
    },
    predictedProgress: [
      { weeks: 4, estimatedScore: 620, confidence: 78, methodology: "Based on recent pace" },
      { weeks: 12, estimatedScore: 700, confidence: 64, methodology: "Assuming steady habits" },
      { weeks: 24, estimatedScore: 810, confidence: 48, methodology: "Long-range projection" },
    ],
    nextRegenerationAt: now + 5 * WEEK,
    generationPromptVersion: "1.0",
    metadata: {
      analyzedActivityCount: 42,
      averageDailyPoints: 18,
      streakDays: 12,
    },
  };
}

export async function GET(request: NextRequest) {
  const parsed = parseQuery(request, TwinQuerySchema);
  if (!parsed.success) return parsed.response;
  const { userId } = parsed.data;

  if (isDemoUid(userId)) {
    return NextResponse.json(
      { data: demoTwin() },
      { headers: { "Cache-Control": "public, max-age=600" } }
    );
  }

  try {
    // Lazy-import the client-SDK-backed service so this route module loads even
    // when Firebase isn't initialized server-side (e.g. during static build).
    const { twinService } = await import("@/services/twin.service");
    const twin = await twinService.getTwin(userId);
    return NextResponse.json(
      { data: twin },
      { headers: { "Cache-Control": "private, max-age=600" } }
    );
  } catch (error) {
    logger.error("Twin fetch failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ data: null, error: "Twin unavailable" }, { status: 200 });
  }
}
