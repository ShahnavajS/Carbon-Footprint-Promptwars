/**
 * useOptimizedDashboard
 * Parallel data-fetching hook for the dashboard.
 *
 * Fetches activities, badges, and the latest insight in parallel via the
 * optimized REST endpoints (~200–300ms vs 2–4s serial). Also exposes
 * `loadMoreActivities` for paginated loading, so the dashboard no longer needs
 * a parallel raw-`fetch` path.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store";
import type { DashboardActivity } from "@/lib/dashboard-stats";

/** Insights return the AiInsight shape (note: `summary`, not `content`). */
export interface DashboardInsight {
  id: string;
  title: string;
  summary: string;
  biggestWin?: string;
  improvementArea?: string;
  nextStep?: string;
  generatedAt: number;
  viewed?: boolean;
}

export interface DashboardBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "unlocked" | "locked";
  earnedAt?: number;
  level?: number;
  progress?: number;
  targetValue?: number;
}

interface DashboardData {
  activities: DashboardActivity[] | null;
  badges: DashboardBadge[] | null;
  insight: DashboardInsight | null;
  loading: boolean;
  error: string | null;
  hasMoreActivities: boolean;
}

const PAGE_SIZE = 10;

export function useOptimizedDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData>({
    activities: null,
    badges: null,
    insight: null,
    loading: true,
    error: null,
    hasMoreActivities: false,
  });
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user?.uid) {
      setData({
        activities: null,
        badges: null,
        insight: null,
        loading: false,
        error: "No user",
        hasMoreActivities: false,
      });
      return;
    }

    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      const [activitiesRes, probeRes, badgesRes, insightRes] = await Promise.all([
        fetch(`/api/activities/recent?userId=${user.uid}&limit=${PAGE_SIZE}`),
        // Probe page 2 to learn whether "Load more" should appear.
        fetch(`/api/activities/recent?userId=${user.uid}&limit=${PAGE_SIZE}&page=2`),
        fetch(`/api/badges/recent?userId=${user.uid}&limit=5`),
        fetch(`/api/insights/latest?userId=${user.uid}`),
      ]);

      if (!activitiesRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [firstPage, probePage, badgesJson, insightJson] = await Promise.all([
        activitiesRes.json(),
        probeRes.json().catch(() => ({ data: [] })),
        badgesRes.json().catch(() => ({ data: [] })),
        insightRes.json().catch(() => null),
      ]);

      setData({
        activities: (firstPage.data as DashboardActivity[]) || [],
        badges: (badgesJson.data as DashboardBadge[]) || [],
        // Latest-insight route returns the insight object directly (no `data`
        // wrapper) when present, or `{ data: null }` when empty.
        insight: (insightJson?.data as DashboardInsight) || insightJson,
        loading: false,
        error: null,
        hasMoreActivities: Boolean(probePage?.data?.length),
      });
      setPage(1);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setData((prev) => ({
        ...prev,
        loading: false,
        error: errorMsg,
      }));
    }
  }, [user?.uid]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const refresh = useCallback(async () => {
    await loadDashboard();
  }, [loadDashboard]);

  /**
   * Loads the next page of activities and appends them. Single source for
   * pagination so the dashboard doesn't maintain its own fetch path.
   */
  const loadMoreActivities = useCallback(async () => {
    if (!user?.uid || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/activities/recent?userId=${user.uid}&limit=${PAGE_SIZE}&page=${nextPage}`
      );
      const json = await res.json();
      const newActivities = (json.data as DashboardActivity[]) || [];
      setData((prev) => ({
        ...prev,
        activities: [...(prev.activities ?? []), ...newActivities],
        hasMoreActivities: Boolean(json.hasMore),
      }));
      setPage(nextPage);
    } catch {
      // Non-fatal: pagination just stops; the existing list stays intact.
      setData((prev) => ({ ...prev, hasMoreActivities: false }));
    } finally {
      setLoadingMore(false);
    }
  }, [user?.uid, page, loadingMore]);

  return {
    ...data,
    refresh,
    loadMoreActivities,
    loadingMore,
  };
}
