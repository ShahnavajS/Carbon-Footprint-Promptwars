"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { AnalogyEngine } from "@/lib/analogy-engine";
import { formatTimeAgo, getCategoryEmoji, type DashboardActivity } from "@/lib/dashboard-stats";

/**
 * Recent activities list with optional "Load more" pagination.
 * Uses the shared dashboard-stats helpers so time/category logic isn't duplicated.
 */

interface RecentActivitiesListProps {
  activities: DashboardActivity[];
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  /** Number of rows to show before pagination (default 5). */
  previewCount?: number;
}

const EMPTY_SVG = (
  <svg
    className="mx-auto h-12 w-12 animate-pulse text-slate-350 dark:text-slate-700"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
    <path d="M22 32H42M32 22V42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export function RecentActivitiesList({
  activities,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  previewCount = 5,
}: RecentActivitiesListProps) {
  return (
    <Card className="rounded-2xl border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <Activity className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <span>Recent Eco Actions</span>
          </CardTitle>
          <CardDescription>Your sustainability log records.</CardDescription>
        </div>
        <Link
          href="/history"
          className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
        >
          View All History
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="mx-auto max-w-sm space-y-3 rounded-2xl border border-dashed border-slate-200/60 py-12 text-center dark:border-slate-800">
            {EMPTY_SVG}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No Actions Recorded
              </h4>
              <p className="mx-auto max-w-[250px] text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                Complete your first Daily Care Ritual above to seed the activity timeline.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {activities.slice(0, previewCount).map((act) => {
                const analogy = AnalogyEngine.getPrimaryAnalogyText(act.carbonReduction);
                return (
                  <div key={act.id} className="flex items-center justify-between py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          act.category === "food"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                            : act.category === "transport"
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                        }`}
                        aria-hidden="true"
                      >
                        {getCategoryEmoji(act.category)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-850 dark:text-slate-200">
                          {act.type}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {formatTimeAgo(act.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <p className="text-xs font-bold text-slate-950 dark:text-white">
                        +{act.ecoPoints} EcoPoints
                      </p>
                      <p className="mt-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        -{act.carbonReduction.toFixed(1)}kg CO₂ saved
                      </p>
                      <span
                        className="mt-0.5 block max-w-[200px] truncate text-[9px] text-slate-400 dark:text-slate-500"
                        title={analogy}
                      >
                        {analogy}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && onLoadMore ? (
              <div className="flex justify-center pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onLoadMore}
                  isLoading={loadingMore}
                  disabled={loadingMore}
                  className="text-xs"
                >
                  {loadingMore ? "Loading..." : "Load More Activities"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
