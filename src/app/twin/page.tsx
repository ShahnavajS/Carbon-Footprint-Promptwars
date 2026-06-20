"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@/hooks/use-auth";
import { AppNav } from "@/components/layout/app-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Target, AlertCircle } from "lucide-react";
import type { SustainabilityTwin } from "@/domain/twin/types";
import { getEcoLevel } from "@/domain/eco-score/levels";

export default function TwinPage() {
  const router = useRouter();
  const { dbUser, signOut } = useAuthActions();
  const [twin, setTwin] = React.useState<SustainabilityTwin | null>(null);
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
    fetch(`/api/twin?userId=${dbUser.uid}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setTwin(json.data ?? null);
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
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800 dark:border-t-emerald-400" />
      </div>
    );
  }

  const level = getEcoLevel(twin?.ecoScore ?? dbUser.score.ecoScore);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppNav userName={dbUser.profile.name} onSignOut={handleSignOut} />

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Your Sustainability Twin
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Meet the future you.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Your AI Twin reflects on your habits, celebrates your strengths, and maps a kind path
            forward — including where you could be in a few months.
          </p>
        </div>

        {!twin ? (
          <Card className="rounded-2xl border-dashed border-slate-300 dark:border-slate-700">
            <CardContent className="p-10 text-center">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Your Twin isn&apos;t ready yet
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-400 dark:text-slate-500">
                Log a few more activities and your Twin will appear with personalized strengths and
                a future-self projection.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Strengths */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <TrendingUp className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  Your strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {twin.strengths.map((s) => (
                  <div
                    key={s.area}
                    className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/10"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {s.area}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {s.score}/100
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{s.description}</p>
                    <p className="mt-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {s.impact}
                    </p>
                    {/* Strength meter */}
                    <div
                      className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950/40"
                      role="progressbar"
                      aria-valuenow={s.score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${s.area} strength`}
                    >
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Weaknesses / growth areas */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <AlertCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  Kind growth areas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {twin.weaknesses.map((w) => (
                  <div
                    key={w.area}
                    className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 dark:border-amber-900/30 dark:bg-amber-950/10"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {w.area}
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        +{w.potentialGain} pts possible
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{w.description}</p>
                    <p className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      {w.recommendation}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {w.actionItems.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400"
                        >
                          <span aria-hidden="true">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Monthly focus */}
            <Card className="rounded-2xl border-emerald-150 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:border-emerald-900/20 dark:from-emerald-950/10 dark:to-teal-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Target className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  This month&apos;s focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {twin.monthlyFocus.area}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {twin.monthlyFocus.estimatedImpact} · {twin.monthlyFocus.difficulty}
                </p>
                <ul className="mt-3 space-y-1">
                  {twin.monthlyFocus.actionItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <span aria-hidden="true">🌱</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Future-self projection */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Sparkles className="h-5 w-5 text-purple-500" aria-hidden="true" />
                  Your future self
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                  Projected EcoScore if you keep nurturing your biome. Today:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {twin.ecoScore} · {level.name}
                  </strong>
                </p>
                <div className="space-y-3">
                  {twin.predictedProgress.map((p) => (
                    <div key={p.weeks} className="flex items-center gap-3">
                      <div className="w-20 shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400">
                        +{p.weeks}w
                      </div>
                      <div className="flex-1">
                        <div
                          className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                          role="progressbar"
                          aria-valuenow={p.estimatedScore}
                          aria-valuemin={0}
                          aria-valuemax={1000}
                          aria-label={`Projected score in ${p.weeks} weeks`}
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-purple-500"
                            style={{ width: `${(p.estimatedScore / 1000) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-24 shrink-0 text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {p.estimatedScore}
                        </span>
                        <span className="ml-1 text-[10px] text-slate-400">
                          ({p.confidence}% sure)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
