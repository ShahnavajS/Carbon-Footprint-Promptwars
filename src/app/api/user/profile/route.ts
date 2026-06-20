/**
 * GET /api/user/profile
 * Returns a user's profile, score, preferences, and metadata.
 *
 * Short-circuits to a seeded demo profile for the demo sentinel user so the
 * public demo runs without a Firebase project. Demo locale is kept consistent
 * with the rest of the app (kg CO₂, INR-aware framing).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import type { EcoScoreUser } from "@/domain/user/types";
import { adminDb } from "@/lib/firebase-admin";
import { logger } from "@/services/logger.service";
import { DEMO_UID, isDemoUid } from "@/config/constants";
import { parseQuery, internalError } from "@/lib/parse-request";

export const maxDuration = 10;

const DEMO_PROFILE = {
  uid: DEMO_UID,
  profile: {
    name: "Aarav Sharma",
    email: "demo@ecoscore.app",
    avatar: null,
    city: "Bengaluru",
    country: "India",
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

const ProfileQuerySchema = z.object({
  userId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const parsed = parseQuery(request, ProfileQuerySchema);
  if (!parsed.success) {
    return parsed.response;
  }
  const { userId } = parsed.data;

  try {
    // Demo mode: instant response
    if (isDemoUid(userId)) {
      return NextResponse.json(DEMO_PROFILE, {
        headers: { "Cache-Control": "public, max-age=3600" },
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

    logger.info("Profile fetched", { userId, duration: Date.now() - startTime });

    return NextResponse.json(profileData, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch (error) {
    logger.error("Profile fetch failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });

    return internalError("Failed to fetch profile");
  }
}
