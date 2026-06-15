"use client";

import { useEffect, useState, useCallback } from "react";
import { InsightRepository } from "@/repositories/insight.repository";
import { useAuthStore } from "@/features/auth/store";
import { trackEvent } from "@/services/analytics";
import type { AiInsight } from "@/domain/insight/types";

export function useInsights() {
  const { user } = useAuthStore();
  const [latestInsight, setLatestInsight] = useState<AiInsight | null>(null);
  const [allInsights, setAllInsights] = useState<AiInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Realtime listener for the latest insight
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = InsightRepository.listenToLatestInsight(user.uid, (insight) => {
      setLatestInsight(insight);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const loadAllInsights = useCallback(async () => {
    if (!user) return;
    try {
      const insights = await InsightRepository.getAllInsights(user.uid);
      setAllInsights(insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights");
    }
  }, [user]);

  const markViewed = useCallback(
    async (insightId: string, weekStart: number) => {
      if (!user) return;
      try {
        await InsightRepository.markInsightViewed(insightId);
        trackEvent("insight_viewed", {
          userId: user.uid,
          insightId,
          weekStart,
        });
        // Update local state optimistically
        setLatestInsight((prev) =>
          prev && prev.id === insightId ? { ...prev, viewed: true } : prev
        );
      } catch (err) {
        console.error("Failed to mark insight viewed:", err);
      }
    },
    [user]
  );

  /**
   * Triggers on-demand insight generation via the API route.
   * Used by the "Generate Now" button in the dashboard.
   */
  const generateInsights = useCallback(async () => {
    if (!user || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate insights");
    } finally {
      setIsGenerating(false);
    }
  }, [user, isGenerating]);

  return {
    latestInsight,
    allInsights,
    isLoading,
    isGenerating,
    error,
    loadAllInsights,
    markViewed,
    generateInsights,
  };
}

export default useInsights;
