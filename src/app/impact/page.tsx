"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@/hooks/use-auth";
import { useOptimizedDashboard } from "@/hooks/use-optimized-dashboard";
import { AppNav } from "@/components/layout/app-nav";
import { Card, CardContent } from "@/components/ui/card";
import { projectConsequences, type ConsequenceProjection } from "@/lib/consequence-engine";
import { TrendingUp, Minus, TrendingDown } from "lucide-react";

const WEEK = 7 * 24 * 60 * 60 * 1000;

interface ScenarioCardProps {
  projection: ConsequenceProjection;
  icon: typeof TrendingUp;
  iconClass: string;
  tone: "emerald" | "amber" | "orange";
}

function ScenarioCard({ projection, icon: Icon, iconClass, tone }: ScenarioCardProps) {
  const ringClass =
    tone === "emerald"
      ? "border-forest-200 dark:border-forest-900/40"
      : tone === "amber"
        ? "border-amber-200 dark:border-amber-900/40"
        : "border-orange-200 dark:border-orange-900/40";
  const accentClass =
    tone === "emerald"
      ? "text-forest-600 dark:text-forest-300"
      : tone === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-orange-600 dark:text-orange-400";

  return (
    <Card className={`rounded-2xl border-2 ${ringClass}`}>
      <CardContent className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconClass}`} aria-hidden="true" />
          <span className={`text-xs font-bold uppercase tracking-wider ${accentClass}`}>
            {projection.label}
          </span>
        </div>

        <div className="mb-4">
          <span className="text-4xl font-extrabold text-ink dark:text-paper">
            {projection.annualCarbonKg.toLocaleString()}
          </span>
          <span className="ml-1 text-sm font-bold text-ink-muted">kg CO₂ / year</span>
        </div>

        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2 text-ink-soft dark:text-forest-200/80">
            <span aria-hidden="true">🌳</span>
            <span>
              <strong>{projection.equivalents.treesYear.toLocaleString()}</strong> trees absorbing
              carbon for a year
            </span>
          </li>
          <li className="flex items-center gap-2 text-ink-soft dark:text-forest-200/80">
            <span aria-hidden="true">🚗</span>
            <span>
              <strong>{projection.equivalents.carKm.toLocaleString()}</strong> km of driving avoided
            </span>
          </li>
          <li className="flex items-center gap-2 text-ink-soft dark:text-forest-200/80">
            <span aria-hidden="true">✈️</span>
            <span>
              <strong>{projection.equivalents.flights}</strong> short-haul flights not taken
            </span>
          </li>
          <li className="flex items-center gap-2 text-ink-soft dark:text-forest-200/80">
            <span aria-hidden="true">🎈</span>
            <span>
              <strong>{projection.equivalents.balloons.toLocaleString()}</strong> balloons of CO₂
              kept out of the sky
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

export default function ImpactPage() {
  const router = useRouter();
  const { dbUser, signOut } = useAuthActions();
  const { activities, loading } = useOptimizedDashboard();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  // Derive the weekly carbon-saved baseline from the last week of activity.
  const { weeklyCarbon, streak } = React.useMemo(() => {
    const list = activities ?? [];
    const since = Date.now() - WEEK;
    const weekly = list.filter((a) => a.createdAt >= since);
    const weeklyCarbon = weekly.reduce((acc, a) => acc + (a.carbonReduction ?? 0), 0);
    return { weeklyCarbon, streak: dbUser?.score?.streak ?? 0 };
  }, [activities, dbUser?.score?.streak]);

  const projections = React.useMemo(
    () => projectConsequences({ weeklyCarbonSavedKg: weeklyCarbon, streak }),
    [weeklyCarbon, streak]
  );

  if (loading || !dbUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-forest-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-hairline border-t-emerald-600 dark:border-forest-800 dark:border-t-emerald-400" />
      </div>
    );
  }

  const hasActivity = weeklyCarbon > 0;

  return (
    <div className="min-h-screen bg-canvas pb-16 text-ink dark:bg-forest-950 dark:text-forest-50">
      <AppNav userName={dbUser?.profile.name} onSignOut={handleSignOut} />

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-forest-200/60 bg-forest-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-forest-700 dark:border-forest-900/30 dark:bg-forest-950/30 dark:text-forest-300">
            🌍 Your Year at This Pace
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink dark:text-paper sm:text-4xl">
            Feel the stakes. Then choose your future.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft dark:text-forest-200/70">
            Your choices today compound into a year of impact. Here&apos;s what each path could mean
            for the planet — not to overwhelm, but to show how much your consistency matters.
          </p>
        </div>

        {hasActivity ? (
          <div className="grid gap-6 md:grid-cols-3">
            <ScenarioCard
              projection={projections.optimistic}
              icon={TrendingUp}
              iconClass="text-emerald-500"
              tone="emerald"
            />
            <ScenarioCard
              projection={projections.steady}
              icon={Minus}
              iconClass="text-amber-500"
              tone="amber"
            />
            <ScenarioCard
              projection={projections.lapse}
              icon={TrendingDown}
              iconClass="text-orange-500"
              tone="orange"
            />
          </div>
        ) : (
          <Card className="rounded-2xl border-dashed border-hairline-strong dark:border-forest-800">
            <CardContent className="p-10 text-center">
              <p className="text-sm font-bold text-ink-soft dark:text-forest-200/80">
                Log a few eco actions to see your projected impact
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs text-ink-muted dark:text-ink-muted">
                Once you&apos;ve saved some carbon this week, this page will project what your year
                could look like across three effort paths.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Hope-forward closing */}
        <div className="rounded-2xl border border-forest-100 bg-forest-50/40 p-6 text-center dark:border-forest-900/30 dark:bg-forest-950/10">
          <p className="text-sm font-semibold text-forest-800 dark:text-forest-300">
            Every gram counts.
          </p>
          <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-ink-soft dark:text-forest-200/70">
            The climate future isn&apos;t locked in — it&apos;s the sum of choices like yours. The
            gap between &ldquo;steady&rdquo; and &ldquo;optimistic&rdquo; is exactly the difference
            your daily rituals make.
          </p>
        </div>
      </main>
    </div>
  );
}
