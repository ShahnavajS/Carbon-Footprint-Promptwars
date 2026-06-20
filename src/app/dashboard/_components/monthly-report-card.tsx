"use client";

import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { AnalogyEngine } from "@/lib/analogy-engine";

/**
 * Monthly report card summarizing last month's impact.
 *
 * Previously this was a fully hardcoded "May 2026" mockup rendered for every
 * user. It now derives its content from the user's actual monthly activities
 * and falls back to an honest empty state when there's nothing to show.
 */

export interface MonthlyReport {
  /** Display label, e.g. "May 2026". */
  monthLabel: string;
  /** Total kg CO₂ prevented that month. */
  carbonPreventedKg: number;
  /** EcoPoints earned that month. */
  pointsEarned: number;
  /** Longest care streak maintained that month. */
  bestStreak: number;
  /** Category the user saved the most in (for the "primary habit"). */
  primaryCategory?: string;
}

interface MonthlyReportCardProps {
  report: MonthlyReport | null;
}

function categoryLabel(category?: string): string {
  switch (category) {
    case "food":
      return "🥗 Diet";
    case "transport":
      return "🚌 Commute";
    case "energy":
      return "⚡ Energy";
    default:
      return "🌱 Habits";
  }
}

function EmptyState() {
  return (
    <div className="py-8 text-center">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No monthly report yet</p>
      <p className="mx-auto mt-1 max-w-xs text-[10px] text-slate-400 dark:text-slate-500">
        Log a few eco actions this month and your impact report will appear here.
      </p>
    </div>
  );
}

export function MonthlyReportCard({ report }: MonthlyReportCardProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-emerald-250 bg-linear-to-br from-emerald-500/5 to-teal-500/5 shadow-xs dark:border-emerald-900/20 dark:bg-emerald-950/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0.5">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Latest Monthly Report
          </span>
          <h3 className="flex items-center gap-1.5 text-base font-bold text-slate-900 dark:text-white">
            <Trophy className="h-4.5 w-4.5 text-amber-500" aria-hidden="true" />
            <span>Sanctuary Recovery Report</span>
          </h3>
        </div>
        {report ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
            {report.monthLabel}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="pt-4">
        {!report ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col justify-center rounded-xl border border-slate-200/50 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                Carbon Prevented
              </span>
              <span className="mt-0.5 text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                {report.carbonPreventedKg.toFixed(1)} kg CO₂
              </span>
              <span className="mt-1 text-[9px] leading-snug text-slate-400 dark:text-slate-500">
                {AnalogyEngine.getPrimaryAnalogyText(report.carbonPreventedKg)}
              </span>
            </div>
            <div className="flex flex-col justify-center rounded-xl border border-slate-200/50 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                Vitality Score
              </span>
              <span className="mt-0.5 text-lg font-extrabold text-blue-700 dark:text-blue-400">
                +{report.pointsEarned} Points
              </span>
              <span className="mt-1 text-[9px] leading-snug text-slate-400 dark:text-slate-500">
                You maintained a peak {report.bestStreak}-day care streak.
              </span>
            </div>
            <div className="flex flex-col justify-center rounded-xl border border-slate-200/50 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                Primary Habit
              </span>
              <span className="mt-0.5 text-lg font-extrabold text-amber-700 dark:text-amber-400">
                {categoryLabel(report.primaryCategory)}
              </span>
              <span className="mt-1 text-[9px] leading-snug text-slate-400 dark:text-slate-500">
                Your biome&apos;s biggest win this month.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
