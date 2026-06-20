"use client";

import * as React from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Pill } from "@/components/ui/pill";
import { getEcoLevel } from "@/domain/eco-score/levels";
import { Award, Flame, TrendingUp } from "lucide-react";

/**
 * The two headline metric cards (EcoScore + Streak) extracted from the
 * dashboard. Level name is derived from the unified config so it can never
 * drift from the rest of the app.
 */

interface MetricCardsProps {
  ecoScore: number;
  streak: number;
  weeklyChange: number;
  lastActivityType?: string;
}

export function MetricCards({
  ecoScore,
  streak,
  weeklyChange,
  lastActivityType,
}: MetricCardsProps) {
  const level = getEcoLevel(ecoScore);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <StatCard
        label="EcoScore Vitality"
        icon={Award}
        value={ecoScore}
        unit="/ 1000"
        trend={
          <div className="flex items-center gap-1.5 text-xs">
            <Pill tone="emerald">
              {level.emoji} Level {level.level}
            </Pill>
            {weeklyChange > 0 ? (
              <span className="flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />+{weeklyChange} this week
              </span>
            ) : (
              <span className="text-slate-400">0 change this week</span>
            )}
          </div>
        }
      />

      <StatCard
        label="Nurturing Streak"
        icon={Flame}
        iconClassName="text-amber-500"
        value={streak}
        unit="days"
        caption={
          lastActivityType ? (
            <>
              Last logged:{" "}
              <strong className="text-slate-700 dark:text-slate-300">{lastActivityType}</strong>
            </>
          ) : (
            "Log an activity today to start a streak!"
          )
        }
      />
    </div>
  );
}
