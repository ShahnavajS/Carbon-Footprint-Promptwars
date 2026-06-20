"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy, ChevronRight, ThumbsUp, X } from "lucide-react";
import { AnalogyEngine } from "@/lib/analogy-engine";

/**
 * AI Recommendations strip. Renders personalized, accept/dismiss-able
 * recommendations with an inline carbon analogy. Recommendation shape matches
 * the AiRecommendation domain type returned by useRecommendations().
 */

export interface DashboardRecommendation {
  id: string;
  action: string;
  reason: string;
  category: string;
  estimatedCarbonSaved: number;
  estimatedPoints: number;
}

interface RecommendationsStripProps {
  recommendations: DashboardRecommendation[];
  /** id of the recommendation being accepted/dismissed (disables buttons). */
  actionLoading: string | null;
  onAccept: (id: string, category: string) => void;
  onDismiss: (id: string) => void;
}

function categoryEmoji(category: string): string {
  return category === "food" ? "🥗" : category === "transport" ? "🚌" : "⚡";
}

export function RecommendationsStrip({
  recommendations,
  actionLoading,
  onAccept,
  onDismiss,
}: RecommendationsStripProps) {
  return (
    <Card className="rounded-2xl border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" />
            AI Recommendations
          </CardTitle>
          <Link
            href="/journey"
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Journey <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.length === 0 ? (
          <div className="space-y-3 py-10 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700"
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
              <path d="M22 32H42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              No recommendations yet. Complete insights to generate suggestions.
            </p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <div
              key={rec.id}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3 dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div className="mt-0.5 shrink-0 text-lg" aria-hidden="true">
                {categoryEmoji(rec.category)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold leading-snug text-slate-900 dark:text-white">
                  {rec.action}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  {rec.reason}
                </p>
                <p className="mt-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  -{rec.estimatedCarbonSaved}kg CO₂ (+{rec.estimatedPoints} pts) •{" "}
                  {AnalogyEngine.getPrimaryAnalogyText(rec.estimatedCarbonSaved)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  onClick={() => onAccept(rec.id, rec.category)}
                  disabled={actionLoading === rec.id}
                  aria-label={`Accept recommendation: ${rec.action}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-950/30 dark:text-emerald-400"
                >
                  <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => onDismiss(rec.id)}
                  disabled={actionLoading === rec.id}
                  aria-label={`Dismiss recommendation: ${rec.action}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-400"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
