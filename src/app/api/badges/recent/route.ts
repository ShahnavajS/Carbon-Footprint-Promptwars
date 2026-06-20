/**
 * GET /api/badges/recent
 * Returns a user's recent badges.
 *
 * Query params:
 *   - userId: string (required)
 *   - limit: number (default 5, max 20)
 *   - status: "unlocked" | "locked" (optional filter)
 *
 * Demo sentinel user → seeded fixture data.
 * Real users: the denormalized badge store (users/{uid}/badges) is populated by
 * the Cloud Functions in `functions/src/phase5.functions.ts`. Until that
 * pipeline runs in this environment we return an honest empty result rather
 * than fake badges.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { logger } from "@/services/logger.service";
import { DEMO_UID, isDemoUid } from "@/config/constants";
import { parseQuery, internalError } from "@/lib/parse-request";

export const maxDuration = 10;

interface DemoBadge {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  status: "unlocked" | "locked";
  earnedAt?: number;
  level?: number;
  progress?: number;
  targetValue?: number;
}

const DEMO_BADGES: DemoBadge[] = [
  {
    id: "badge-transit-master",
    userId: DEMO_UID,
    name: "Transit Master",
    description: "Used public transit 50+ times",
    icon: "🚌",
    status: "unlocked",
    earnedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    level: 2,
  },
  {
    id: "badge-green-eater",
    userId: DEMO_UID,
    name: "Green Eater",
    description: "Vegetarian for 30+ days",
    icon: "🥗",
    status: "unlocked",
    earnedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    level: 1,
  },
  {
    id: "badge-eco-streak",
    userId: DEMO_UID,
    name: "Eco Streak",
    description: "15-day activity streak",
    icon: "🔥",
    status: "unlocked",
    earnedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    level: 1,
  },
  {
    id: "badge-solar-champion",
    userId: DEMO_UID,
    name: "Solar Champion",
    description: "100+ eco points from renewable energy",
    icon: "☀️",
    status: "locked",
    progress: 67,
    targetValue: 100,
  },
];

const BadgesQuerySchema = z.object({
  userId: z.string().min(1),
  limit: z.preprocess(
    (v) => (v === undefined || v === "" ? 5 : Number(v)),
    z.number().int().min(1).max(20)
  ),
  status: z.enum(["unlocked", "locked"]).optional(),
});

function filterByStatus(badges: DemoBadge[], status?: "unlocked" | "locked") {
  if (!status) return badges;
  return badges.filter((b) => b.status === status);
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const parsed = parseQuery(request, BadgesQuerySchema);
  if (!parsed.success) {
    return parsed.response;
  }
  const { userId, limit, status } = parsed.data;

  try {
    // Demo mode: instant response
    if (isDemoUid(userId)) {
      const filtered = filterByStatus(DEMO_BADGES, status);
      return NextResponse.json(
        {
          data: filtered.slice(0, limit),
          total: filtered.length,
          unlockedCount: DEMO_BADGES.filter((b) => b.status === "unlocked").length,
        },
        { headers: { "Cache-Control": "public, max-age=3600" } }
      );
    }

    // Real user: badges are awarded by Cloud Functions into users/{uid}/badges.
    if (!adminDb) {
      throw new Error("Firebase Admin is not initialized");
    }

    const snapshot = await adminDb
      .collectionGroup("badges")
      .where("userId", "==", userId)
      .orderBy("unlockedAt", "desc")
      .limit(limit)
      .get();

    const badges: DemoBadge[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId,
        name: data.name ?? data.badgeId ?? "Badge",
        description: data.description ?? "",
        icon: data.icon ?? "🏅",
        status: data.unlockedAt ? "unlocked" : "locked",
        earnedAt: data.unlockedAt,
        level: data.level,
        progress: data.progress,
        targetValue: data.targetValue,
      };
    });

    const filtered = filterByStatus(badges, status);
    logger.info("Badges fetched", {
      userId,
      limit,
      status,
      count: filtered.length,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        data: filtered.slice(0, limit),
        total: filtered.length,
        unlockedCount: badges.filter((b) => b.status === "unlocked").length,
      },
      { headers: { "Cache-Control": "private, max-age=3600" } }
    );
  } catch (error) {
    logger.error("Badges fetch failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });

    return internalError("Failed to fetch badges");
  }
}
