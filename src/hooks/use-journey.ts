"use client";

import { useMemo, useEffect } from "react";
import { useAuthStore } from "@/features/auth/store";
import { JourneyService } from "@/services/journey.service";
import { useActivities } from "@/hooks/use-activities";
import { trackEvent } from "@/services/analytics";

export function useJourney() {
  const { user, dbUser } = useAuthStore();
  const { activities } = useActivities();

  const ecoScore = dbUser?.score.ecoScore ?? 0;
  const totalActivities = activities.length;

  const currentLevel = useMemo(() => JourneyService.getLevel(ecoScore), [ecoScore]);

  const nextLevel = useMemo(() => JourneyService.getNextLevel(ecoScore), [ecoScore]);

  const levelProgress = useMemo(() => JourneyService.getLevelProgress(ecoScore), [ecoScore]);

  const milestones = useMemo(() => {
    if (!dbUser) return [];
    return JourneyService.evaluateMilestones(dbUser, totalActivities);
  }, [dbUser, totalActivities]);

  const achievedMilestones = useMemo(() => milestones.filter((m) => m.achieved), [milestones]);

  const nextMilestone = useMemo(
    () => milestones.filter((m) => !m.achieved).sort((a, b) => b.progress - a.progress)[0] ?? null,
    [milestones]
  );

  const pointsToNextLevel = useMemo(() => {
    if (!nextLevel) return 0;
    return nextLevel.minScore - ecoScore;
  }, [nextLevel, ecoScore]);

  // Track journey view once user data is loaded
  useEffect(() => {
    if (!user || !dbUser) return;
    trackEvent("journey_viewed", {
      userId: user.uid,
      currentLevel: currentLevel.level,
      ecoScore,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return {
    ecoScore,
    currentLevel,
    nextLevel,
    levelProgress,
    milestones,
    achievedMilestones,
    nextMilestone,
    pointsToNextLevel,
    isLoading: !dbUser,
  };
}

export default useJourney;
