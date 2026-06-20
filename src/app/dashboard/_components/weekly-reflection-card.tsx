"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap } from "lucide-react";

/**
 * Weekly AI Reflection card. Renders the latest AI-generated insight in a
 * "nature journal" format, or an empty state prompting generation.
 *
 * NOTE: the insight body is `summary` (per the AiInsight domain type), not
 * `content` — the previous inlined card read the wrong field and showed blank.
 */

export interface DashboardInsight {
  id: string;
  generatedAt: number;
  title: string;
  summary: string;
  biggestWin?: string;
  nextStep?: string;
}

interface WeeklyReflectionCardProps {
  insight: DashboardInsight | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onMarkViewed: (id: string, generatedAt: number) => void;
}

export function WeeklyReflectionCard({
  insight,
  isGenerating,
  onGenerate,
  onMarkViewed,
}: WeeklyReflectionCardProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-forest-150 bg-linear-to-tr from-forest-50/60 via-teal-50/20 to-amber-50/40 shadow-sm dark:from-slate-900/60 dark:to-teal-950/20">
      <CardHeader className="border-b border-forest-100/50 pb-2 dark:border-forest-800/40">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-forest-800 dark:text-forest-300">
            <Sparkles className="h-5 w-5 text-forest-600" aria-hidden="true" />
            Weekly Nature Reflection
          </h3>
          <Link
            href="/simulator"
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-forest-600 hover:underline dark:text-forest-300"
          >
            <Zap className="h-3 w-3" aria-hidden="true" />
            Forecaster
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {insight ? (
          <div
            className="cursor-pointer space-y-4"
            onClick={() => onMarkViewed(insight.id, insight.generatedAt)}
          >
            <h4 className="text-base font-extrabold leading-snug text-ink dark:text-paper">
              &ldquo;{insight.title}&rdquo;
            </h4>
            <p className="text-xs font-medium italic leading-relaxed text-ink-soft dark:text-forest-200/70">
              {insight.summary}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="rounded-xl border border-forest-100/40 bg-white/60 p-2.5 dark:border-forest-800/40 dark:bg-forest-900/40">
                <span className="block text-[8px] font-extrabold uppercase tracking-widest text-ink-muted">
                  Biggest Win
                </span>
                <p className="mt-1 text-[10px] font-bold text-forest-800 dark:text-forest-300">
                  {insight.biggestWin || "Nurturing the canopy"}
                </p>
              </div>
              <div className="rounded-xl border border-forest-100/40 bg-white/60 p-2.5 dark:border-forest-800/40 dark:bg-forest-900/40">
                <span className="block text-[8px] font-extrabold uppercase tracking-widest text-ink-muted">
                  Next Step
                </span>
                <p className="mt-1 text-[10px] font-bold text-forest-800 dark:text-forest-300">
                  {insight.nextStep || "One green step today"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-ink-muted dark:text-ink-soft"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
              <path
                d="M32 20V28M32 36H32.01"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="space-y-1">
              <p className="text-xs font-bold text-ink-soft dark:text-forest-200/60">
                Reflection Journal is Empty
              </p>
              <p className="mx-auto max-w-xs text-[10px] text-ink-muted dark:text-ink-muted">
                Log activities to let Gemini compose your weekly climate reflection report.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onGenerate}
              isLoading={isGenerating}
              disabled={isGenerating}
              className="rounded-full px-5 text-xs"
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Compose Reflection
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
