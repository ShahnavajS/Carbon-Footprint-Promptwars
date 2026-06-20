/**
 * GET /api/activities/recent
 * Optimized activities endpoint with pagination.
 *
 * Query params:
 *   - userId: string (required)
 *   - limit: number (default 10, max 50)
 *   - page: number (default 1)
 *   - category: "food" | "transport" | "energy" (optional filter)
 *
 * Returns a uniform paginated envelope and short-circuits to seeded demo data
 * when the demo sentinel user is requested.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { logger } from "@/services/logger.service";
import { DEMO_UID, isDemoUid } from "@/config/constants";
import { parseQuery, internalError } from "@/lib/parse-request";
import type { ActionType, ActivityCategory } from "@/domain/activity/types";

export const maxDuration = 10;

interface DashboardActivity {
  id: string;
  userId: string;
  /** Display label (mirrors `actionType`). Kept as `type` for client compat. */
  type: string;
  category: ActivityCategory;
  carbonReduction: number;
  ecoPoints: number;
  timestamp: number;
  createdAt: number;
}

// ─── Demo fixtures ──────────────────────────────────────────────────────────
// Seeded in the production schema ({ actionType, carbonSaved, ecoPoints }) so
// the demo path and the real path share one shape — no `?? type / ?? carbonReduction`
// shim required.

const DAY = 24 * 60 * 60 * 1000;

const DEMO_ACTIVITIES: DashboardActivity[] = [
  {
    id: "demo-1",
    userId: DEMO_UID,
    type: "Bicycle",
    category: "transport",
    carbonReduction: 1.3,
    ecoPoints: 15,
    timestamp: Date.now() - 1 * DAY,
    createdAt: Date.now() - 1 * DAY,
  },
  {
    id: "demo-2",
    userId: DEMO_UID,
    type: "Metro",
    category: "transport",
    carbonReduction: 1.2,
    ecoPoints: 15,
    timestamp: Date.now() - 2 * DAY,
    createdAt: Date.now() - 2 * DAY,
  },
  {
    id: "demo-3",
    userId: DEMO_UID,
    type: "Vegetarian Meal",
    category: "food",
    carbonReduction: 0.8,
    ecoPoints: 10,
    timestamp: Date.now() - 3 * DAY,
    createdAt: Date.now() - 3 * DAY,
  },
  {
    id: "demo-4",
    userId: DEMO_UID,
    type: "Line Dried Clothes",
    category: "energy",
    carbonReduction: 0.8,
    ecoPoints: 10,
    timestamp: Date.now() - 4 * DAY,
    createdAt: Date.now() - 4 * DAY,
  },
];

// ─── Request validation ──────────────────────────────────────────────────────

const RecentActivitiesQuerySchema = z.object({
  userId: z.string().min(1),
  limit: z.preprocess(
    (v) => (v === undefined || v === "" ? 10 : Number(v)),
    z.number().int().min(1).max(50)
  ),
  page: z.preprocess((v) => (v === undefined || v === "" ? 1 : Number(v)), z.number().int().min(1)),
  category: z.enum(["food", "transport", "energy"]).optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDashboardActivity(id: string, data: FirebaseFirestore.DocumentData): DashboardActivity {
  return {
    id,
    userId: data.userId,
    type: (data.actionType ?? data.type) as ActionType,
    category: data.category as ActivityCategory,
    carbonReduction: data.carbonSaved ?? data.carbonReduction ?? 0,
    ecoPoints: data.ecoPoints ?? 0,
    timestamp: data.createdAt ?? data.timestamp ?? Date.now(),
    createdAt: data.createdAt ?? data.timestamp ?? Date.now(),
  };
}

function paginate<T>(items: T[], page: number, limit: number) {
  const skip = (page - 1) * limit;
  const paged = items.slice(skip, skip + limit);
  return { paged, hasMore: skip + limit < items.length };
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const parsed = parseQuery(request, RecentActivitiesQuerySchema);
  if (!parsed.success) {
    return parsed.response;
  }
  const { userId, limit, page, category } = parsed.data;

  try {
    // Demo mode: return instant paginated demo data
    if (isDemoUid(userId)) {
      const filtered = category
        ? DEMO_ACTIVITIES.filter((a) => a.category === category)
        : DEMO_ACTIVITIES;
      const { paged, hasMore } = paginate(filtered, page, limit);

      return NextResponse.json(
        { data: paged, page, limit, hasMore, total: filtered.length },
        { headers: { "Cache-Control": "public, max-age=300" } }
      );
    }

    // Real user: fetch from Firestore
    if (!adminDb) {
      throw new Error("Firebase Admin is not initialized");
    }

    const snapshot = await adminDb
      .collection("activities")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit * 2)
      .get();

    const activities = snapshot.docs.map((doc) => toDashboardActivity(doc.id, doc.data()));
    const filtered = category ? activities.filter((a) => a.category === category) : activities;
    const { paged, hasMore } = paginate(filtered, page, limit);

    logger.info("Activities fetched", {
      userId,
      limit,
      page,
      category,
      count: paged.length,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { data: paged, page, limit, hasMore, total: filtered.length },
      { headers: { "Cache-Control": "private, max-age=300" } }
    );
  } catch (error) {
    logger.error("Activities fetch failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });

    return internalError("Failed to fetch activities");
  }
}
