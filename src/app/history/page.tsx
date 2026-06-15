"use client";

import * as React from "react";
import Link from "next/link";
import { useActivities } from "@/hooks/use-activities";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/loading";
import { ArrowLeft, Calendar, History as HistoryIcon } from "lucide-react";
import { AnalogyEngine } from "@/lib/analogy-engine";
import type { EcoActivity, ActivityCategory } from "@/domain/activity/types";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

export default function HistoryPage() {
  const { fetchPagedActivities, isLoading: initialLoading } = useActivities();

  const [activitiesList, setActivitiesList] = React.useState<EcoActivity[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<ActivityCategory | "all">("all");

  const [lastDoc, setLastDoc] = React.useState<
    QueryDocumentSnapshot<DocumentData, DocumentData> | undefined
  >(undefined);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const PAGE_SIZE = 10;

  const loadInitialActivities = React.useCallback(async () => {
    setError(null);
    setActivitiesList([]);
    setLastDoc(undefined);
    setHasMore(true);

    try {
      const filterCat = selectedCategory === "all" ? undefined : selectedCategory;
      const res = await fetchPagedActivities({
        category: filterCat,
        pageSize: PAGE_SIZE,
      });
      setActivitiesList(res.activities);
      setLastDoc(res.lastVisible);
      if (res.activities.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg || "Failed to load activity logs.");
    }
  }, [selectedCategory, fetchPagedActivities]);

  // Load activities when page mounts or filters change
  React.useEffect(() => {
    loadInitialActivities();
  }, [loadInitialActivities]);

  const loadMoreActivities = async () => {
    if (isLoadingMore || !hasMore || !lastDoc) return;
    setIsLoadingMore(true);
    setError(null);

    try {
      const filterCat = selectedCategory === "all" ? undefined : selectedCategory;
      const res = await fetchPagedActivities({
        category: filterCat,
        pageSize: PAGE_SIZE,
        lastDoc: lastDoc,
      });

      setActivitiesList((prev) => [...prev, ...res.activities]);
      setLastDoc(res.lastVisible);
      if (res.activities.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg || "Failed to load more activity logs.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const formatDateString = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Navigation Back */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* History Card */}
        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="space-y-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-emerald-600" />
              <span>Activity History Log</span>
            </CardTitle>

            {/* Category Filter Controls */}
            <div
              className="flex flex-wrap items-center gap-1.5 pt-2"
              role="group"
              aria-label="Category filters"
            >
              {[
                { val: "all", label: "All Actions" },
                { val: "food", label: "🍔 Food" },
                { val: "transport", label: "🚌 Transit" },
                { val: "energy", label: "⚡ Energy" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSelectedCategory(val as ActivityCategory | "all")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    selectedCategory === val
                      ? "bg-emerald-600 text-white dark:bg-emerald-500"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/20 dark:text-red-400"
              >
                {error}
              </div>
            )}

            {/* Timeline logs */}
            {initialLoading && activitiesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Spinner className="h-8 w-8 text-emerald-600" />
                <p className="text-xs text-slate-400">Loading activity records...</p>
              </div>
            ) : activitiesList.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl dark:border-slate-800">
                <Calendar className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
                <h4 className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No logs found
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  We couldn&apos;t find any activities matching the filter selection.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative border-l-2 border-slate-200 pl-4 ml-2 dark:border-slate-800 space-y-6">
                  {activitiesList.map((act) => (
                    <div key={act.id} className="relative group">
                      {/* Timeline dot marker */}
                      <span className="absolute -left-[23px] top-1.5 flex h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-slate-900 dark:bg-emerald-500" />

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span
                            className={`inline-block text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide mb-1 ${
                              act.category === "food"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                : act.category === "transport"
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            }`}
                          >
                            {act.category}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {act.actionType}
                          </h4>
                          <time className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                            {formatDateString(act.createdAt)}
                          </time>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-xs font-extrabold text-slate-950 dark:text-white">
                            +{act.ecoPoints} pts
                          </p>
                          <p className="text-[10px] text-emerald-600 font-bold dark:text-emerald-400 mt-0.5">
                            -{act.carbonSaved.toFixed(1)}kg CO₂
                          </p>
                          <span
                            className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-[200px] truncate block"
                            title={AnalogyEngine.getPrimaryAnalogyText(act.carbonSaved)}
                          >
                            {AnalogyEngine.getPrimaryAnalogyText(act.carbonSaved)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="pt-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMoreActivities}
                      isLoading={isLoadingMore}
                      className="w-full sm:w-auto"
                    >
                      Load More Logs
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
