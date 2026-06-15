import { describe, it, expect, vi, beforeEach } from "vitest";
import { StreakService } from "@/services/streak.service";
import { ActivityService, ACTIVITY_REWARDS } from "@/services/activity.service";
import { UserRepository } from "@/repositories/user.repository";
import { ChallengeRepository } from "@/repositories/challenge.repository";
import { trackEvent } from "@/services/analytics";
import { getDocs } from "firebase/firestore";
import type { EcoScoreUser } from "@/domain/user/types";
import type { EcoActivity } from "@/domain/activity/types";

// ─── Shared timestamps ──────────────────────────────────────────────────────
const baseTimestamp = new Date("2026-06-09T12:00:00Z").getTime();
const sameDayTimestamp = new Date("2026-06-09T18:00:00Z").getTime();
const nextDayTimestamp = new Date("2026-06-10T09:00:00Z").getTime();
const twoDaysLaterTimestamp = new Date("2026-06-11T12:00:00Z").getTime();

// ─── Mock Firebase app / db ─────────────────────────────────────────────────
vi.mock("@/services/firebase", () => ({
  db: {},
  analytics: null,
}));

// ─── Mock firebase/firestore ─────────────────────────────────────────────────
// getDocs is used by checkChallengeCompleted — default to empty (not completed)
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({ id: "mock-doc" })),
  collection: vi.fn(() => ({ id: "mock-coll" })),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  onSnapshot: vi.fn(() => () => {}),
  query: vi.fn((...args: unknown[]) => args[0]),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
}));

// ─── Mock Repositories ────────────────────────────────────────────────────────
vi.mock("@/repositories/activity.repository", () => ({
  ActivityRepository: {
    logActivity: vi.fn().mockImplementation((act: Omit<EcoActivity, "id">) =>
      Promise.resolve({ id: "activity_test_123", ...act })
    ),
  },
}));

vi.mock("@/repositories/user.repository", () => ({
  UserRepository: {
    getUser: vi.fn(),
    updateUser: vi.fn().mockResolvedValue(undefined),
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
      carbonReward: 1.0,
    },
  ],
  ChallengeRepository: {
    completeChallenge: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/services/analytics", () => ({
  trackEvent: vi.fn(),
}));

// ─── Streak Engine ───────────────────────────────────────────────────────────

describe("EcoScore Streak Calculations Calendar Engine", () => {
  it("starts streak at 1 for first-ever activity", () => {
    const res = StreakService.calculateStreak(null, 0, 0, baseTimestamp);
    expect(res.currentStreak).toBe(1);
    expect(res.bestStreak).toBe(1);
    expect(res.lastActivityAt).toBe(baseTimestamp);
  });

  it("maintains streak when logged multiple times same calendar day", () => {
    const res = StreakService.calculateStreak(baseTimestamp, 3, 5, sameDayTimestamp);
    expect(res.currentStreak).toBe(3);
    expect(res.bestStreak).toBe(5);
  });

  it("increments streak by 1 on successive calendar day", () => {
    const res = StreakService.calculateStreak(baseTimestamp, 3, 5, nextDayTimestamp);
    expect(res.currentStreak).toBe(4);
    expect(res.bestStreak).toBe(5);
  });

  it("updates bestStreak when currentStreak surpasses previous record", () => {
    const res = StreakService.calculateStreak(baseTimestamp, 5, 5, nextDayTimestamp);
    expect(res.currentStreak).toBe(6);
    expect(res.bestStreak).toBe(6);
  });

  it("resets streak to 1 when more than 1 calendar day is missed", () => {
    const res = StreakService.calculateStreak(baseTimestamp, 4, 10, twoDaysLaterTimestamp);
    expect(res.currentStreak).toBe(1);
    expect(res.bestStreak).toBe(10);
  });
});

// ─── Activity Rewards Map ────────────────────────────────────────────────────

describe("ACTIVITY_REWARDS lookup table", () => {
  it("returns correct points and carbon for food actions", () => {
    expect(ACTIVITY_REWARDS["Vegetarian Meal"]).toEqual({ points: 10, carbon: 0.8 });
    expect(ACTIVITY_REWARDS["Vegan Meal"]).toEqual({ points: 15, carbon: 1.0 });
    expect(ACTIVITY_REWARDS["Home Cooked Meal"]).toEqual({ points: 5, carbon: 0.3 });
  });

  it("returns correct points and carbon for transport actions", () => {
    expect(ACTIVITY_REWARDS["Walked"]).toEqual({ points: 15, carbon: 1.5 });
    expect(ACTIVITY_REWARDS["Bicycle"]).toEqual({ points: 15, carbon: 1.3 });
    expect(ACTIVITY_REWARDS["Metro"]).toEqual({ points: 15, carbon: 1.2 });
    expect(ACTIVITY_REWARDS["Bus"]).toEqual({ points: 10, carbon: 0.8 });
  });

  it("returns correct points and carbon for energy actions", () => {
    expect(ACTIVITY_REWARDS["Reduced AC Usage"]).toEqual({ points: 10, carbon: 0.6 });
    expect(ACTIVITY_REWARDS["Switched Off Appliances"]).toEqual({ points: 5, carbon: 0.4 });
    expect(ACTIVITY_REWARDS["Line Dried Clothes"]).toEqual({ points: 10, carbon: 0.8 });
  });
});

// ─── Activity Service Integration (mocked) ──────────────────────────────────

describe("ActivityService.logActivity", () => {
  const mockUser: Partial<EcoScoreUser> = {
    uid: "user_test_1",
    profile: {
      name: "Test User",
      email: "test@test.com",
      avatar: null,
      city: "London",
      country: "UK",
      language: "en",
    },
    score: {
      ecoScore: 650,
      level: 3,
      streak: 2,
      bestStreak: 5,
      // lastActivityAt > 1 day ago → streak resets
      lastActivityAt: baseTimestamp - 48 * 3600 * 1000,
      carbonSaved: 5.0,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(UserRepository.getUser).mockResolvedValue(mockUser as EcoScoreUser);
  });

  it("logs action with no challenge match, fires analytics and updates user score", async () => {
    const result = await ActivityService.logActivity("user_test_1", "food", "Home Cooked Meal");

    // Activity was persisted
    const { ActivityRepository: AR } = await import("@/repositories/activity.repository");
    expect(AR.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_test_1",
        category: "food",
        actionType: "Home Cooked Meal",
        ecoPoints: 5,
        carbonSaved: 0.3,
      })
    );

    // Analytics event fired
    expect(trackEvent).toHaveBeenCalledWith(
      "activity_created",
      expect.objectContaining({
        userId: "user_test_1",
        category: "food",
        actionType: "Home Cooked Meal",
        ecoPoints: 5,
        carbonSaved: 0.3,
      })
    );

    // Score updated: 650 + round(5/5) = 651; streak resets (>1 day gap)
    expect(UserRepository.updateUser).toHaveBeenCalledWith(
      "user_test_1",
      expect.objectContaining({
        score: expect.objectContaining({
          ecoScore: 651,
          streak: 1,
          carbonSaved: 5.3,
        }),
      })
    );

    // "Home Cooked Meal" does not match any challenge (only Vegetarian/Vegan do)
    expect(result.challengeCompleted).toBe(false);
  });

  it("does not exceed EcoScore cap of 1000", async () => {
    vi.mocked(UserRepository.getUser).mockResolvedValue({
      ...mockUser,
      score: { ...mockUser.score!, ecoScore: 999, level: 4 },
    } as EcoScoreUser);

    await ActivityService.logActivity("user_test_1", "transport", "Walked");

    // 999 + round(15/5)=3 → capped at 1000
    expect(UserRepository.updateUser).toHaveBeenCalledWith(
      "user_test_1",
      expect.objectContaining({
        score: expect.objectContaining({ ecoScore: 1000 }),
      })
    );
  });

  it("completes a matching transport challenge once and applies bonus rewards", async () => {
    const result = await ActivityService.logActivity("user_test_1", "transport", "Metro");

    expect(ChallengeRepository.completeChallenge).toHaveBeenCalledWith(
      "user_test_1",
      "challenge_transport"
    );
    expect(result.challengeCompleted).toBe(true);

    // Base Metro 15 points + transport challenge 15 points => score +6.
    expect(UserRepository.updateUser).toHaveBeenCalledWith(
      "user_test_1",
      expect.objectContaining({
        score: expect.objectContaining({
          ecoScore: 656,
          carbonSaved: 7.2,
        }),
      })
    );
    expect(trackEvent).toHaveBeenCalledWith(
      "challenge_completed",
      expect.objectContaining({
        userId: "user_test_1",
        challengeId: "challenge_transport",
      })
    );
  });

  it("does not award challenge bonus when the challenge completion already exists", async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [
        {
          id: "challenge_transport",
          data: () => ({ completed: true }),
        },
      ],
    } as never);

    const result = await ActivityService.logActivity("user_test_1", "transport", "Metro");

    expect(ChallengeRepository.completeChallenge).not.toHaveBeenCalled();
    expect(result.challengeCompleted).toBe(false);
    expect(UserRepository.updateUser).toHaveBeenCalledWith(
      "user_test_1",
      expect.objectContaining({
        score: expect.objectContaining({
          ecoScore: 653,
          carbonSaved: 6.2,
        }),
      })
    );
  });

  it("fails fast when the user profile cannot be loaded", async () => {
    vi.mocked(UserRepository.getUser).mockResolvedValueOnce(null);

    await expect(ActivityService.logActivity("missing-user", "food", "Vegetarian Meal")).rejects.toThrow(
      "User profile not found"
    );
  });

  it("rejects unknown action types before writing activity data", async () => {
    const { ActivityRepository: AR } = await import("@/repositories/activity.repository");

    await expect(
      ActivityService.logActivity("user_test_1", "food", "Imported Beef" as never)
    ).rejects.toThrow("Reward values not defined");

    expect(AR.logActivity).not.toHaveBeenCalled();
    expect(UserRepository.updateUser).not.toHaveBeenCalled();
  });
});
