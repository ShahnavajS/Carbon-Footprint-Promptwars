"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CheckSquare } from "lucide-react";

/**
 * Today's Challenges card. Renders the user's daily challenges with a progress
 * bar and per-challenge completion state. Challenge shape matches the
 * useActivities() hook's derived challenges.
 */

export interface DashboardChallenge {
  id: string;
  title: string;
  pointsReward: number;
  carbonReward: number;
  completed: boolean;
}

interface ChallengesCardProps {
  challenges: DashboardChallenge[];
  /** Max challenges shown in the header progress (default 3). */
  total?: number;
}

export function ChallengesCard({ challenges, total = 3 }: ChallengesCardProps) {
  const completed = challenges.filter((c) => c.completed).length;

  return (
    <Card className="flex h-full flex-col rounded-2xl border-hairline/60 bg-white shadow-sm dark:border-forest-800 dark:bg-forest-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <CheckSquare className="h-5 w-5 text-forest-600" aria-hidden="true" />
            <span>Today&apos;s Challenges</span>
          </CardTitle>
          <span className="text-xs font-bold text-ink-muted">
            {completed}/{total}
          </span>
        </div>
        <div className="mt-2">
          <ProgressBar value={completed / total} tone="forest" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {challenges.map((ch) => (
          <div
            key={ch.id}
            className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
              ch.completed
                ? "border-forest-100 bg-forest-50/30 text-ink-muted dark:border-emerald-950/20 dark:bg-forest-950/10"
                : "border-hairline bg-white dark:border-forest-800 dark:bg-forest-900"
            }`}
          >
            <div
              role="checkbox"
              aria-checked={ch.completed}
              aria-label={ch.completed ? `${ch.title} completed` : `${ch.title} not completed`}
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                ch.completed
                  ? "border-emerald-600 bg-forest-600 text-white dark:border-emerald-400 dark:bg-forest-400"
                  : "border-hairline-strong bg-white dark:border-forest-800"
              }`}
            >
              {ch.completed && (
                <svg
                  className="h-3.5 w-3.5 fill-none stroke-current stroke-2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div>
              <h4
                className={`text-xs font-bold ${
                  ch.completed
                    ? "text-ink-muted line-through dark:text-ink-soft"
                    : "text-ink dark:text-forest-100"
                }`}
              >
                {ch.title}
              </h4>
              <p className="mt-0.5 text-[10px] font-bold text-forest-600 dark:text-forest-300">
                +{ch.pointsReward} pts • -{ch.carbonReward}kg CO₂
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
