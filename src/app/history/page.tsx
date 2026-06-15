"use client";

import * as React from "react";
import Link from "next/link";
import { useActivities } from "@/hooks/use-activities";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/loading";
import { ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8 text-slate-900 dark:text-slate-100 pb-20">
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

        {/* Climate Journal Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Your Climate Journal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            A chronological timeline of every green ritual you completed. Each entry details the
            real-world carbon equivalent saved for our biosphere.
          </p>
        </div>

        {/* History Card */}
        <Card className="border-slate-200/60 shadow-md dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 py-5">
            <div
              className="flex flex-wrap items-center gap-1.5"
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
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === val
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-655 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-350 dark:border-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <div
                role="alert"
                className="rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-650 dark:bg-red-950/20 dark:text-red-400 mb-6 text-center"
              >
                {error}
              </div>
            )}

            {/* Timeline logs */}
            {initialLoading && activitiesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Spinner className="h-8 w-8 text-emerald-600" />
                <p className="text-xs text-slate-400">Opening Climate Journal...</p>
              </div>
            ) : activitiesList.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200/60 rounded-2xl dark:border-slate-800 max-w-sm mx-auto space-y-4">
                <svg
                  className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
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
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-750 dark:text-slate-350">
                    No Logs Found
                  </h4>
                  <p className="text-xs text-slate-450 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
                    You haven&apos;t logged any rituals in this category yet. Nurture your biome on
                    the dashboard!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative border-l-2 border-slate-200/80 pl-6 ml-2 dark:border-slate-800 space-y-8">
                  {activitiesList.map((act) => (
                    <div key={act.id} className="relative group">
                      {/* Timeline dot marker */}
                      <span className="absolute -left-[31px] top-1.5 flex h-3 w-3 rounded-full bg-emerald-650 ring-4 ring-white dark:ring-slate-900 dark:bg-emerald-500 transition-transform group-hover:scale-125" />

                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${
                              act.category === "food"
                                ? "bg-amber-50 text-amber-700 border border-amber-100/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                                : act.category === "transport"
                                  ? "bg-blue-50 text-blue-700 border border-blue-100/60 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-100/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                            }`}
                          >
                            {act.category}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {act.actionType}
                          </h4>
                          <time className="text-[10px] text-slate-400 dark:text-slate-500 block">
                            {formatDateString(act.createdAt)}
                          </time>
                        </div>
                        <div className="text-right flex flex-col items-end gap-0.5">
                          <p className="text-xs font-extrabold text-slate-950 dark:text-white">
                            +{act.ecoPoints} pts
                          </p>
                          <p className="text-[10px] text-emerald-650 font-bold dark:text-emerald-400">
                            -{act.carbonSaved.toFixed(1)}kg CO₂
                          </p>
                          <span
                            className="text-[9.5px] text-slate-450 dark:text-slate-500 mt-1 max-w-[200px] truncate block leading-snug font-medium"
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
                  <div className="pt-6 text-center border-t border-slate-100 dark:border-slate-850">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMoreActivities}
                      isLoading={isLoadingMore}
                      className="w-full sm:w-auto rounded-full px-6 text-xs font-bold"
                    >
                      Load More Journal Logs
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
