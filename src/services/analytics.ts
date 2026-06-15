export type EventTypeMap = {
  signup_started: { method: "email" | "google" };
  signup_completed: { userId: string; method: "email" | "google" };
  signin_completed: { userId: string; method: "email" | "google" };
  onboarding_started: { userId: string };
  onboarding_completed: { userId: string; score: number; level: number };
  ecoscore_generated: { userId: string; score: number; level: number };
  pwa_install_prompt_shown: { trigger: "banner" | "browser" };
  pwa_installed: { userId?: string };
  activity_created: {
    userId: string;
    category: string;
    actionType: string;
    ecoPoints: number;
    carbonSaved: number;
  };
  challenge_completed: {
    userId: string;
    challengeId: string;
    pointsReward: number;
    carbonReward: number;
  };
  streak_updated: {
    userId: string;
    currentStreak: number;
    bestStreak: number;
  };
  eco_score_updated: {
    userId: string;
    oldScore: number;
    newScore: number;
  };
  dashboard_viewed: {
    userId: string;
  };
  insight_viewed: {
    userId: string;
    insightId: string;
    weekStart: number;
  };
  recommendation_accepted: {
    userId: string;
    recommendationId: string;
    category: string;
  };
  simulation_run: {
    userId: string;
    scenarioId: string;
    annualCarbonSaved: number;
  };
  journey_viewed: {
    userId: string;
    currentLevel: number;
    ecoScore: number;
  };
  goal_adjusted: {
    userId: string;
    previousDifficulty: string;
    newDifficulty: string;
    weeklyActivityCount: number;
  };
};

/**
 * Tracks custom user interactions and application telemetry with a strict type-safe schema.
 */
export function trackEvent<T extends keyof EventTypeMap>(eventName: T, params: EventTypeMap[T]) {
  const enrichedParams = {
    ...params,
    timestamp: Date.now(),
    platform: "web" as const,
  };

  if (typeof window !== "undefined") {
    void Promise.all([import("firebase/analytics"), import("./firebase")])
      .then(([{ logEvent }, { analytics }]) => {
        if (!analytics) {
          return;
        }

        logEvent(analytics, eventName, enrichedParams);

        if (process.env.NODE_ENV === "development") {
          console.log(`[Analytics] Event logged: ${eventName}`, enrichedParams);
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error(`Analytics tracking failed for event: ${eventName}`, error);
        }
      });

    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics Server/Mock] Suppressed event: ${eventName}`, enrichedParams);
  }
}

export function trackUserAuth(action: "sign_in" | "sign_up" | "sign_out", userId: string) {
  if (action === "sign_in") {
    trackEvent("signin_completed", { userId, method: "email" });
  } else if (action === "sign_up") {
    trackEvent("signup_completed", { userId, method: "email" });
  }
}
