/**
 * GET /api/user/profile
 * Optimized user profile endpoint
 * Returns: Only user profile, score, preferences
 * Cache: 1 hour (user unlikely to change frequently)
 * Performance: ~100ms
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { EcoScoreUser } from "@/domain/user/types";
import { adminDb } from "@/lib/firebase-admin";
import { logger } from "@/services/logger.service";

export const maxDuration = 10;

const DEMO_PROFILE = {
  uid: "test-eco-user-id",
  profile: {
    name: "Test Eco User",
    email: "test@ecoscore.com",
    avatar: null,
    city: "San Francisco",
    country: "United States",
    language: "en",
  },
  score: {
    ecoScore: 580,
    level: 3,
    points: 580,
    percentToNextLevel: 80,
    streak: 15,
    carbonSaved: 42.5,
  },
  sustainability: {
    carbonFootprint: 4.2,
    dailyAverage: 0.14,
    status: "Good",
  },
  goals: {
    dailyTarget: 50,
    weeklyTarget: 350,
    monthlyCarbonReduction: 100,
  },
  metadata: {
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    lastActiveAt: Date.now() - 1000,
    totalActivitiesLogged: 156,
    premiumTier: "silver",
  },
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    // Demo mode: instant response
    if (userId === "test-eco-user-id") {
      return NextResponse.json(DEMO_PROFILE, {
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    if (!adminDb) {
      throw new Error("Firebase Admin is not initialized");
    }

    const snapshot = await adminDb.collection("users").doc(userId).get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = { uid: userId, ...snapshot.data() } as EcoScoreUser;

    // Return only essential profile data
    const profileData = {
      uid: user.uid,
      profile: user.profile,
      score: user.score,
      sustainability: user.sustainability,
      goals: user.goals,
      metadata: user.metadata,
    };

    logger.info("Profile fetched", {
      userId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(profileData, {
      headers: {
        "Cache-Control": "private, max-age=3600", // 1-hour cache
      },
    });
  } catch (error) {
    logger.error("Profile fetch failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });

    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
