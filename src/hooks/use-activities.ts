"use client";

import { useEffect, useState, useCallback } from "react";
import { ActivityRepository } from "@/repositories/activity.repository";
import { ChallengeRepository, DEFAULT_CHALLENGES } from "@/repositories/challenge.repository";
import { ActivityService } from "@/services/activity.service";
import { useAuthStore } from "@/features/auth/store";
import { UserService } from "@/services/user.service";
import type {
  EcoActivity,
  DailyChallenge,
  ActivityCategory,
  ActionType,
} from "@/domain/activity/types";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

export function useActivities() {
  const { user, setDbUser } = useAuthStore();
  const [activities, setActivities] = useState<EcoActivity[]>([]);
  const [challenges, setChallenges] = useState<(DailyChallenge & { completed: boolean })[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync daily challenges combined with user completion state
  useEffect(() => {
    const combined = DEFAULT_CHALLENGES.map((ch) => ({
      ...ch,
      completed: !!completions[ch.id],
    }));
    setChallenges(combined);
  }, [completions]);

  // Realtime activities listener
  useEffect(() => {
    if (!user) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribeActivities = ActivityRepository.listenToActivities(user.uid, (list) => {
      setActivities(list);
      setIsLoading(false);
    });

    const unsubscribeCompletions = ChallengeRepository.listenToCompletions(user.uid, (map) => {
      setCompletions(map);
    });

    return () => {
      unsubscribeActivities();
      unsubscribeCompletions();
    };
  }, [user]);

  // Logging function
  const logAction = async (category: ActivityCategory, actionType: ActionType) => {
    if (!user) throw new Error("Authentication required to log activities.");
    setError(null);
    try {
      const res = await ActivityService.logActivity(user.uid, category, actionType);

      // Sync the user state in store to reflect score/streak/budget immediately
      const profile = await UserService.getUser(user.uid);
      setDbUser(profile);

      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log activity";
      setError(msg);
      throw err;
    }
  };

  // Pagination helper for history page
  const fetchPagedActivities = useCallback(
    async (filters: {
      category?: string;
      pageSize: number;
      lastDoc?: QueryDocumentSnapshot<DocumentData, DocumentData>;
    }) => {
      if (!user) return { activities: [], lastVisible: undefined };
      return ActivityRepository.getActivitiesPaged(user.uid, filters);
    },
    [user]
  );

  return {
    activities,
    challenges,
    isLoading,
    error,
    logAction,
    fetchPagedActivities,
  };
}

export default useActivities;
