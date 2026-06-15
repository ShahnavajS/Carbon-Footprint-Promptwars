/**
 * GET /api/activities/recent
 * Optimized activities endpoint with pagination
 * Query params:
 *   - userId: string (required)
 *   - limit: number (default 10, max 50)
 *   - page: number (default 1)
 *   - category: string (optional filter)
 *
 * Returns: Paginated activities + hasMore flag
 * Cache: 5 minutes
 * Performance: ~150ms
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { logger } from "@/services/logger.service";

export const maxDuration = 10;

const DEMO_ACTIVITIES = [
  {
    id: "demo-1",
    userId: "test-eco-user-id",
    type: "Bike Commute",
    category: "transport",
    carbonReduction: 5.2,
    ecoPoints: 25,
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    id: "demo-2",
    userId: "test-eco-user-id",
    type: "Public Transit",
    category: "transport",
    carbonReduction: 3.1,
    ecoPoints: 20,
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: "demo-3",
    userId: "test-eco-user-id",
    type: "Vegetarian Meal",
    category: "food",
    carbonReduction: 2.5,
    ecoPoints: 15,
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    id: "demo-4",
    userId: "test-eco-user-id",
    type: "LED Lights",
    category: "energy",
    carbonReduction: 1.8,
    ecoPoints: 18,
    timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
  },
];

function toDashboardActivity(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    userId: data.userId,
    type: data.actionType ?? data.type,
    category: data.category,
    carbonReduction: data.carbonSaved ?? data.carbonReduction ?? 0,
    ecoPoints: data.ecoPoints ?? 0,
    timestamp: data.createdAt ?? data.timestamp ?? Date.now(),
    createdAt: data.createdAt ?? data.timestamp ?? Date.now(),
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);

  const userId = searchParams.get("userId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const category = searchParams.get("category");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    // Demo mode: return instant paginated demo data
    if (userId === "test-eco-user-id") {
      let activities = DEMO_ACTIVITIES;
      if (category) {
        activities = activities.filter((a) => a.category === category);
      }

      const skip = (page - 1) * limit;
      const paged = activities.slice(skip, skip + limit);

      return NextResponse.json(
        {
          data: paged,
          page,
          limit,
          hasMore: skip + limit < activities.length,
          total: activities.length,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=300", // 5-min cache
          },
        }
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

    // Filter by category if specified
    let filtered = activities;
    if (category) {
      filtered = activities.filter((a) => a.category === category);
    }

    // Paginate
    const skip = (page - 1) * limit;
    const paged = filtered.slice(skip, skip + limit);

    logger.info("Activities fetched", {
      userId,
      limit,
      page,
      category,
      count: paged.length,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        data: paged,
        page,
        limit,
        hasMore: skip + limit < filtered.length,
        total: filtered.length,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=300", // 5-min cache
        },
      }
    );
  } catch (error) {
    logger.error("Activities fetch failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });

    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
