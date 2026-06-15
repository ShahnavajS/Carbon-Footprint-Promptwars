"use client";

import * as React from "react";
import Link from "next/link";
import { useJourney } from "@/hooks/use-journey";
import { JOURNEY_LEVELS } from "@/services/journey.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trophy, Target, CheckCircle2, Lock } from "lucide-react";

export default function JourneyPage() {
  const {
    ecoScore,
    currentLevel,
    nextLevel,
    levelProgress,
    milestones,
    achievedMilestones,
    nextMilestone,
    pointsToNextLevel,
    isLoading,
  } = useJourney();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800 dark:border-t-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Header */}
      <nav className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
            <Trophy className="h-5 w-5" />
            <span>My Journey</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Current Level Hero */}
        <Card className="border-0 bg-linear-to-br from-emerald-600 to-emerald-800 text-white shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 opacity-10 text-[120px] leading-none select-none pointer-events-none">
            {currentLevel.emoji}
          </div>
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-200 text-sm font-semibold uppercase tracking-widest mb-1">
                  Current Level
                </p>
                <h1 className="text-4xl font-extrabold mb-1 flex items-center gap-3">
                  {currentLevel.emoji} {currentLevel.name}
                </h1>
                <p className="text-emerald-100 text-sm max-w-xs">{currentLevel.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-5xl font-extrabold">{ecoScore}</p>
                <p className="text-emerald-200 text-xs font-semibold">/1000 EcoScore</p>
              </div>
            </div>

            {/* Level Progress Bar */}
            {nextLevel && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-emerald-200">{currentLevel.name}</span>
                  <span className="text-emerald-200">
                    {nextLevel.name} {nextLevel.emoji}
                  </span>
                </div>
                <div
                  className="h-3 w-full rounded-full bg-white/20 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(levelProgress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Level progress: ${Math.round(levelProgress * 100)}%`}
                >
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{ width: `${levelProgress * 100}%` }}
                  />
                </div>
                <p className="text-xs text-emerald-200 text-center">
                  {pointsToNextLevel} points to unlock {nextLevel.name}
                </p>
              </div>
            )}
            {!nextLevel && (
              <p className="mt-4 text-sm font-bold text-emerald-100">
                🏆 You have reached the highest level — Climate Champion!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Next Milestone Spotlight */}
        {nextMilestone && (
          <Card className="border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                Next Achievement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-3xl dark:bg-amber-950/20">
                  {nextMilestone.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {nextMilestone.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {nextMilestone.description}
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${nextMilestone.progress * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    {Math.round(nextMilestone.progress * 100)}% complete
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Milestones Timeline */}
        <section aria-label="Milestone timeline">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Milestones
            <span className="text-xs font-semibold text-slate-400 ml-auto">
              {achievedMilestones.length}/{milestones.length} achieved
            </span>
          </h2>

          <div className="relative pl-8 space-y-4 before:absolute before:left-3.5 before:top-0 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="relative flex items-start gap-4"
                aria-label={`${milestone.title}: ${milestone.achieved ? "achieved" : "not yet achieved"}`}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute -left-[19px] top-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    milestone.achieved
                      ? "border-emerald-500 bg-emerald-500 dark:border-emerald-400 dark:bg-emerald-400"
                      : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                  aria-hidden="true"
                >
                  {milestone.achieved ? (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  ) : (
                    <Lock className="h-3 w-3 text-slate-400" />
                  )}
                </div>

                {/* Card */}
                <div
                  className={`flex-1 rounded-xl border p-4 transition-all ${
                    milestone.achieved
                      ? "border-emerald-100 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-950/10"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden="true">
                        {milestone.emoji}
                      </span>
                      <div>
                        <h3
                          className={`text-sm font-bold ${milestone.achieved ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
                        >
                          {milestone.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                    {milestone.achieved && (
                      <span className="shrink-0 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        ✓ Done
                      </span>
                    )}
                  </div>

                  {/* Progress bar for unachieved */}
                  {!milestone.achieved && milestone.progress > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all"
                          style={{ width: `${milestone.progress * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {Math.round(milestone.progress * 100)}% there
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* All Levels Overview */}
        <section aria-label="Level overview">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white mb-4">
            Level Roadmap
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {JOURNEY_LEVELS.map((level) => {
              const isCurrentLevel = currentLevel.level === level.level;
              const isAchieved = ecoScore >= level.minScore;
              return (
                <div
                  key={level.level}
                  className={`rounded-2xl border p-4 transition-all ${
                    isCurrentLevel
                      ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
                      : isAchieved
                        ? "border-emerald-100 bg-white dark:border-emerald-900/30 dark:bg-slate-900"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 opacity-50"
                  }`}
                  aria-current={isCurrentLevel ? "true" : undefined}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl" aria-hidden="true">
                      {level.emoji}
                    </span>
                    {isCurrentLevel && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{level.name}</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {level.minScore}–{level.maxScore} EcoScore
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {level.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
