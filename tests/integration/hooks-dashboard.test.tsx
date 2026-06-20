import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EcoActivity } from "@/domain/activity/types";
import type { AiRecommendation } from "@/domain/insight/types";
import type { EcoScoreUser } from "@/domain/user/types";

const authState = vi.hoisted(() => ({
  user: null as { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null,
  dbUser: null as EcoScoreUser | null,
  setDbUser: vi.fn(),
}));

const activityMocks = vi.hoisted(() => ({
  listenToActivities: vi.fn(),
  listenToCompletions: vi.fn(),
  logActivity: vi.fn(),
  getUser: vi.fn(),
}));

const recommendationMocks = vi.hoisted(() => ({
  listenToActiveRecommendations: vi.fn(),
  acceptRecommendation: vi.fn(),
  dismissRecommendation: vi.fn(),
}));

vi.mock("@/features/auth/store", () => ({
  useAuthStore: vi.fn(() => authState),
}));

vi.mock("@/repositories/activity.repository", () => ({
  ActivityRepository: {
    listenToActivities: activityMocks.listenToActivities,
    getActivitiesPaged: vi.fn(),
  },
}));

vi.mock("@/repositories/challenge.repository", () => ({
  DEFAULT_CHALLENGES: [
    {
      id: "challenge_transport",
      title: "Take public transport today",
      category: "transport",
      actionType: "Metro",
      pointsReward: 15,
      carbonReward: 1,
    },
    {
      id: "challenge_vegetarian",
      title: "Eat one vegetarian meal",
      category: "food",
      actionType: "Vegetarian Meal",
      pointsReward: 10,
      carbonReward: 0.5,
    },
  ],
  ChallengeRepository: {
    listenToCompletions: activityMocks.listenToCompletions,
  },
}));

vi.mock("@/services/activity.service", () => ({
  ActivityService: {
    logActivity: activityMocks.logActivity,
  },
}));

vi.mock("@/services/user.service", () => ({
  UserService: {
    getUser: activityMocks.getUser,
  },
}));

vi.mock("@/repositories/recommendation.repository", () => ({
  RecommendationRepository: {
    listenToActiveRecommendations: recommendationMocks.listenToActiveRecommendations,
    acceptRecommendation: recommendationMocks.acceptRecommendation,
    dismissRecommendation: recommendationMocks.dismissRecommendation,
  },
}));

vi.mock("@/services/analytics", () => ({
  trackEvent: vi.fn(),
}));

const activity: EcoActivity = {
  id: "activity-1",
  userId: "user-1",
  category: "transport",
  actionType: "Metro",
  ecoPoints: 15,
  carbonSaved: 1.2,
  createdAt: 1000,
};

const recommendation: AiRecommendation = {
  id: "rec-1",
  userId: "user-1",
  category: "energy",
  action: "Reduce AC usage",
  reason: "Save electricity",
  estimatedCarbonSaved: 0.6,
  estimatedPoints: 10,
  accepted: null,
  generatedAt: 2000,
};

describe("dashboard-facing hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = null;
    authState.dbUser = null;
    global.fetch = vi.fn();
    activityMocks.listenToActivities.mockImplementation((_uid, callback) => {
      callback([activity]);
      return vi.fn();
    });
    activityMocks.listenToCompletions.mockImplementation((_uid, callback) => {
      callback({ challenge_transport: true });
      return vi.fn();
    });
    activityMocks.logActivity.mockResolvedValue({
      activity,
      challengeCompleted: true,
    });
    activityMocks.getUser.mockResolvedValue({ uid: "user-1" });
    recommendationMocks.listenToActiveRecommendations.mockImplementation((_uid, callback) => {
      callback([recommendation]);
      return vi.fn();
    });
    recommendationMocks.acceptRecommendation.mockResolvedValue(undefined);
    recommendationMocks.dismissRecommendation.mockResolvedValue(undefined);
  });

  it("useActivities returns empty state and rejects logging when unauthenticated", async () => {
    const { useActivities } = await import("@/hooks/use-activities");

    const { result } = renderHook(() => useActivities());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.activities).toEqual([]);
    await expect(result.current.logAction("food", "Vegetarian Meal")).rejects.toThrow(
      "Authentication required"
    );
  });

  it("useActivities merges realtime activity and challenge completion state", async () => {
    authState.user = {
      uid: "user-1",
      email: "user@example.com",
      displayName: "User",
      photoURL: null,
    };
    const { useActivities } = await import("@/hooks/use-activities");

    const { result } = renderHook(() => useActivities());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.activities).toEqual([activity]);
    expect(result.current.challenges).toEqual([
      expect.objectContaining({ id: "challenge_transport", completed: true }),
      expect.objectContaining({ id: "challenge_vegetarian", completed: false }),
    ]);

    await act(async () => {
      await result.current.logAction("transport", "Metro");
    });

    expect(activityMocks.logActivity).toHaveBeenCalledWith("user-1", "transport", "Metro");
    expect(activityMocks.getUser).toHaveBeenCalledWith("user-1");
    expect(authState.setDbUser).toHaveBeenCalledWith({ uid: "user-1" });
  });

  it("useActivities surfaces Firestore write failures from logging", async () => {
    authState.user = {
      uid: "user-1",
      email: "user@example.com",
      displayName: "User",
      photoURL: null,
    };
    activityMocks.logActivity.mockRejectedValueOnce(new Error("Firestore write failed"));
    const { useActivities } = await import("@/hooks/use-activities");

    const { result } = renderHook(() => useActivities());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.logAction("energy", "Reduced AC Usage");
      } catch (error) {
        caughtError = error;
      }
    });

    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toBe("Firestore write failed");
    await waitFor(() => expect(result.current.error).toBe("Firestore write failed"));
  });

  it("useRecommendations optimistically removes accepted and dismissed items", async () => {
    authState.user = {
      uid: "user-1",
      email: "user@example.com",
      displayName: "User",
      photoURL: null,
    };
    const { useRecommendations } = await import("@/hooks/use-recommendations");

    const { result } = renderHook(() => useRecommendations());

    await waitFor(() => expect(result.current.recommendations).toHaveLength(1));
    await act(async () => {
      await result.current.accept("rec-1", "energy");
    });
    expect(result.current.recommendations).toEqual([]);
    expect(recommendationMocks.acceptRecommendation).toHaveBeenCalledWith("rec-1");

    recommendationMocks.listenToActiveRecommendations.mockImplementationOnce((_uid, callback) => {
      callback([recommendation]);
      return vi.fn();
    });
    const { result: secondResult } = renderHook(() => useRecommendations());
    await waitFor(() => expect(secondResult.current.recommendations).toHaveLength(1));
    await act(async () => {
      await secondResult.current.dismiss("rec-1");
    });
    expect(secondResult.current.recommendations).toEqual([]);
    expect(recommendationMocks.dismissRecommendation).toHaveBeenCalledWith("rec-1");
  });

  it("useOptimizedDashboard loads activities, badges, and insights from API endpoints", async () => {
    authState.user = {
      uid: "user-1",
      email: "user@example.com",
      displayName: "User",
      photoURL: null,
    };
    // The hook fires 4 parallel fetches: activities, page-2 probe, badges, insight.
    const ok = (data: unknown): Response =>
      ({ ok: true, json: async () => data }) as Response;
    vi.mocked(fetch)
      .mockResolvedValueOnce(ok({ data: [{ id: "dash-activity" }] })) // page 1
      .mockResolvedValueOnce(ok({ data: [] })) // page-2 probe (empty → no "load more")
      .mockResolvedValueOnce(ok({ data: [{ id: "badge-1" }] })) // badges
      .mockResolvedValueOnce(ok({ data: { id: "insight-1" } })); // insight
    const { useOptimizedDashboard } = await import("@/hooks/use-optimized-dashboard");

    const { result } = renderHook(() => useOptimizedDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activities).toEqual([{ id: "dash-activity" }]);
    expect(result.current.badges).toEqual([{ id: "badge-1" }]);
    expect(result.current.insight).toEqual({ id: "insight-1" });
  });

  it("useOptimizedDashboard reports network failures without clearing previous data shape", async () => {
    authState.user = {
      uid: "user-1",
      email: "user@example.com",
      displayName: "User",
      photoURL: null,
    };
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));
    const { useOptimizedDashboard } = await import("@/hooks/use-optimized-dashboard");

    const { result } = renderHook(() => useOptimizedDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("network down");
    expect(result.current.activities).toBeNull();
  });
});
