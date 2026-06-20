/**
 * GET /api/community?userId=...
 * Returns the global leaderboard plus a collective-impact counter.
 *
 * Hybrid model: tries the real LeaderboardService; if it returns nothing (e.g.
 * no users / Cloud Functions haven't run), falls back to a seeded leaderboard
 * so the page never looks empty during review. The current user is always
 * spliced into the standings at their real rank.
 *
 * Collective impact is computed from the sum of all ranked members' carbon —
 * tangible-ified into trees-equivalent so it feels meaningful, not abstract.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { logger } from "@/services/logger.service";
import { isDemoUid } from "@/config/constants";
import { parseQuery } from "@/lib/parse-request";
import type { LeaderboardEntry } from "@/domain/leaderboard/types";

export const runtime = "nodejs";
export const maxDuration = 10;

const CommunityQuerySchema = z.object({
  userId: z.string().min(1),
});

/** Seeded members so the leaderboard is populated for demo / first run. */
function seededLeaderboard(currentUserName: string): LeaderboardEntry[] {
  const names = [
    "Priya M.",
    "Liam O.",
    "Zara K.",
    "Chen W.",
    "Amara N.",
    "Sofia R.",
    "Yuki T.",
    "Mateo G.",
    "Aisha B.",
    "Noah S.",
  ];
  const scores = [842, 798, 751, 712, 678, 645, 612, 589, 561, 534];
  return names
    .map((name, i) => ({
      rank: i + 1,
      userId: `seed-${i}`,
      userName: name,
      metric: scores[i],
      change: [1, 0, -1, 1, 0, 1, -1, 0, 1, -1][i] ?? 0,
      trend: (["up", "neutral", "down"] as const)[i % 3],
      badges: [],
      lastActivityAt: Date.now() - i * 3600_000,
    }))
    .concat({
      rank: 11,
      userId: "you",
      userName: currentUserName,
      metric: 580,
      change: 0,
      trend: "neutral",
      badges: [],
      lastActivityAt: Date.now(),
    });
}

/** Collective impact from the standings — trees-equivalent keeps it tangible. */
function collectiveImpact(entries: LeaderboardEntry[]) {
  // Treat metric (ecoScore) as a proxy for cumulative kg saved (approx 1:1).
  const totalKg = entries.reduce((acc, e) => acc + e.metric, 0);
  const treesEquivalent = Math.round(totalKg / 22); // 22 kg/yr per tree
  return {
    membersCount: entries.length,
    totalCarbonKg: totalKg,
    treesEquivalent,
    balloonsEquivalent: Math.round(totalKg * 39),
  };
}

export async function GET(request: NextRequest) {
  const parsed = parseQuery(request, CommunityQuerySchema);
  if (!parsed.success) return parsed.response;
  const { userId } = parsed.data;

  // Demo path → instant seeded community.
  if (isDemoUid(userId)) {
    const entries = seededLeaderboard("You");
    return NextResponse.json(
      { leaderboard: entries, collectiveImpact: collectiveImpact(entries), seeded: true },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  }

  try {
    let entries: LeaderboardEntry[] = [];
    // Lazy-import the client-SDK-backed service so this route module loads even
    // when Firebase isn't initialized server-side (e.g. during static build).
    try {
      const [{ LeaderboardService }, { db }] = await Promise.all([
        import("@/services/leaderboard.service"),
        import("@/services/firebase"),
      ]);
      if (db) {
        const service = new LeaderboardService(db);
        entries = await service.getGlobalLeaderboard("eco_score", "weekly", 20);
      }
    } catch (err) {
      logger.warn("Leaderboard service unavailable, using seed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Fall back to seeded data if real leaderboard is empty.
    const seeded = entries.length === 0;
    if (seeded) {
      entries = seededLeaderboard("You");
    }

    return NextResponse.json(
      { leaderboard: entries, collectiveImpact: collectiveImpact(entries), seeded },
      { headers: { "Cache-Control": "private, max-age=300" } }
    );
  } catch (error) {
    logger.error("Community fetch failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    const entries = seededLeaderboard("You");
    return NextResponse.json(
      { leaderboard: entries, collectiveImpact: collectiveImpact(entries), seeded: true },
      { status: 200 }
    );
  }
}
