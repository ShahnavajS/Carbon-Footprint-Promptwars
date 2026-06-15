"use client";

import { useEffect, useState, useCallback } from "react";
import { RecommendationRepository } from "@/repositories/recommendation.repository";
import { useAuthStore } from "@/features/auth/store";
import { trackEvent } from "@/services/analytics";
import type { AiRecommendation } from "@/domain/insight/types";

export function useRecommendations() {
  const { user } = useAuthStore();
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Realtime listener for pending recommendations
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = RecommendationRepository.listenToActiveRecommendations(user.uid, (recs) => {
      setRecommendations(recs);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const accept = useCallback(
    async (recId: string, category: string) => {
      if (!user || actionLoading) return;
      setActionLoading(recId);
      setError(null);
      try {
        await RecommendationRepository.acceptRecommendation(recId);
        trackEvent("recommendation_accepted", {
          userId: user.uid,
          recommendationId: recId,
          category,
        });
        // Optimistic update — remove from active list
        setRecommendations((prev) => prev.filter((r) => r.id !== recId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to accept recommendation");
      } finally {
        setActionLoading(null);
      }
    },
    [user, actionLoading]
  );

  const dismiss = useCallback(
    async (recId: string) => {
      if (!user || actionLoading) return;
      setActionLoading(recId);
      setError(null);
      try {
        await RecommendationRepository.dismissRecommendation(recId);
        setRecommendations((prev) => prev.filter((r) => r.id !== recId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to dismiss recommendation");
      } finally {
        setActionLoading(null);
      }
    },
    [user, actionLoading]
  );

  return {
    recommendations,
    isLoading,
    error,
    actionLoading,
    accept,
    dismiss,
  };
}

export default useRecommendations;
