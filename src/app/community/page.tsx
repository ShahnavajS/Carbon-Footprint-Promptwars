"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@/hooks/use-auth";
import { AppNav } from "@/components/layout/app-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LeaderboardEntry } from "@/domain/leaderboard/types";

interface CollectiveImpact {
  membersCount: number;
  totalCarbonKg: number;
  treesEquivalent: number;
  balloonsEquivalent: number;
}

const TREND_ICON = {
  up: { Icon: TrendingUp, class: "text-emerald-500" },
  down: { Icon: TrendingDown, class: "text-orange-500" },
  neutral: { Icon: Minus, class: "text-ink-muted" },
};

export default function CommunityPage() {
  const router = useRouter();
  const { dbUser, signOut } = useAuthActions();
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([]);
  const [impact, setImpact] = React.useState<CollectiveImpact | null>(null);
  const [seeded, setSeeded] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  React.useEffect(() => {
    if (!dbUser) return;
    let cancelled = false;
    fetch(`/api/community?userId=${dbUser.uid}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setLeaderboard(json.leaderboard ?? []);
        setImpact(json.collectiveImpact ?? null);
        setSeeded(Boolean(json.seeded));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dbUser]);

  if (loading || !dbUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-forest-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-hairline border-t-emerald-600 dark:border-forest-800 dark:border-t-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-16 text-ink dark:bg-forest-950 dark:text-forest-50">
      <AppNav userName={dbUser.profile.name} onSignOut={handleSignOut} />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-forest-200/60 bg-forest-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-forest-700 dark:border-forest-900/30 dark:bg-forest-950/30 dark:text-forest-300">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Community
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink dark:text-paper sm:text-4xl">
            You&apos;re not doing this alone.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft dark:text-forest-200/70">
            Real change is a collective effort. See how the EcoScore community is healing the planet
            together — and where you stand among people on the same journey.
          </p>
        </div>

        {/* Collective impact counter — the social-proof hero */}
        {impact && (
          <Card className="overflow-hidden rounded-2xl border-forest-150 bg-gradient-to-br from-forest-500 to-teal-600 text-white shadow-lg">
            <CardContent className="p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">
                Together this week
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">
                  {impact.totalCarbonKg.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-emerald-100">kg CO₂ prevented</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-extrabold">{impact.membersCount}</p>
                  <p className="text-[10px] text-emerald-100">members</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold">
                    {impact.treesEquivalent.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-100">trees 🌳</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold">
                    {Math.round(impact.balloonsEquivalent / 1000)}k
                  </p>
                  <p className="text-[10px] text-emerald-100">balloons 🎈</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-ink dark:text-paper">Weekly standings</h2>
              {seeded && (
                <span className="rounded-full bg-canvas-soft px-2 py-0.5 text-[10px] font-bold text-ink-muted dark:bg-forest-900 dark:text-ink-muted">
                  demo members
                </span>
              )}
            </div>

            <ol className="space-y-2">
              {leaderboard.map((entry) => {
                const isYou = entry.userId === "you" || entry.userName === dbUser.profile.name;
                const trend = TREND_ICON[entry.trend];
                const TrendIcon = trend.Icon;
                return (
                  <li
                    key={`${entry.userId}-${entry.rank}`}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                      isYou
                        ? "border-forest-200 bg-forest-50/60 dark:border-forest-900/40 dark:bg-forest-950/20"
                        : "border-hairline dark:border-forest-800"
                    }`}
                  >
                    <span
                      className={`w-7 shrink-0 text-center text-sm font-extrabold ${
                        entry.rank <= 3 ? "text-amber-500" : "text-ink-muted"
                      }`}
                      aria-label={`Rank ${entry.rank}`}
                    >
                      {entry.rank}
                    </span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-forest-700 dark:bg-forest-950/40 dark:text-forest-300">
                      {entry.userName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink dark:text-paper">
                        {entry.userName}
                        {isYou && (
                          <span className="ml-1.5 text-[10px] font-bold text-forest-600 dark:text-forest-300">
                            (you)
                          </span>
                        )}
                      </p>
                    </div>
                    <TrendIcon className={`h-4 w-4 shrink-0 ${trend.class}`} aria-hidden="true" />
                    <span className="w-12 shrink-0 text-right text-sm font-bold text-ink dark:text-paper">
                      {entry.metric}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* Closing nudge */}
        <p className="text-center text-xs text-ink-muted dark:text-ink-muted">
          Every action you log nudges the whole community forward. 🌍
        </p>
      </main>
    </div>
  );
}
