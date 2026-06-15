import { describe, it, expect } from "vitest";
import { GoalAdjustmentService, DIFFICULTY_PRESETS } from "@/services/goal-adjustment.service";
import type { EcoActivity } from "@/domain/activity/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const now = Date.now();

function makeActivity(daysAgo: number): EcoActivity {
  return {
    id: `act_${daysAgo}`,
    userId: "user_1",
    category: "transport",
    actionType: "Metro",
    ecoPoints: 15,
    carbonSaved: 1.2,
    createdAt: now - daysAgo * 24 * 60 * 60 * 1000,
  };
}

/** Creates N activities all within the last 6 days */
function makeActivitiesInWeek(count: number): EcoActivity[] {
  return Array.from({ length: count }, (_, i) => makeActivity(i));
}

/** Creates activities older than 7 days (should NOT be counted) */
function makeOldActivities(count: number): EcoActivity[] {
  return Array.from({ length: count }, (_, i) => makeActivity(8 + i));
}

// ─── DIFFICULTY_PRESETS ───────────────────────────────────────────────────────

describe("GoalAdjustmentService — DIFFICULTY_PRESETS", () => {
  it("easy preset has weeklyActivityTarget of 2", () => {
    expect(DIFFICULTY_PRESETS.easy.weeklyActivityTarget).toBe(2);
  });

  it("medium preset has weeklyActivityTarget of 4", () => {
    expect(DIFFICULTY_PRESETS.medium.weeklyActivityTarget).toBe(4);
  });

  it("hard preset has daily target (7)", () => {
    expect(DIFFICULTY_PRESETS.hard.weeklyActivityTarget).toBe(7);
  });
});

// ─── evaluateDifficulty ───────────────────────────────────────────────────────

describe("GoalAdjustmentService — evaluateDifficulty", () => {
  describe("succeeding user (≥7 actions/week)", () => {
    const activities = makeActivitiesInWeek(7);

    it("increases difficulty from easy → medium", () => {
      const result = GoalAdjustmentService.evaluateDifficulty(activities, "easy");
      expect(result.newDifficulty).toBe("medium");
      expect(result.adjusted).toBe(true);
    });

    it("increases difficulty from medium → hard", () => {
      const result = GoalAdjustmentService.evaluateDifficulty(activities, "medium");
      expect(result.newDifficulty).toBe("hard");
      expect(result.adjusted).toBe(true);
    });

    it("does NOT increase beyond hard", () => {
      const result = GoalAdjustmentService.evaluateDifficulty(activities, "hard");
      expect(result.newDifficulty).toBe("hard");
      expect(result.adjusted).toBe(false);
    });

    it("returns encouraging reason message", () => {
      const result = GoalAdjustmentService.evaluateDifficulty(activities, "easy");
      expect(result.reason).toContain("7");
    });
  });

  describe("struggling user (<2 actions/week)", () => {
    const activities = makeActivitiesInWeek(1);

    it("decreases difficulty from hard → medium", () => {
      const result = GoalAdjustmentService.evaluateDifficulty(activities, "hard");
      expect(result.newDifficulty).toBe("medium");
      expect(result.adjusted).toBe(true);
    });

    it("decreases difficulty from medium → easy", () => {
      const result = GoalAdjustmentService.evaluateDifficulty(activities, "medium");
      expect(result.newDifficulty).toBe("easy");
      expect(result.adjusted).toBe(true);
    });

    it("does NOT decrease below easy", () => {
      const result = GoalAdjustmentService.evaluateDifficulty(activities, "easy");
      expect(result.newDifficulty).toBe("easy");
      expect(result.adjusted).toBe(false);
    });
  });

  describe("stable user (3–6 actions/week)", () => {
    it("makes no adjustment with 4 actions on medium", () => {
      const activities = makeActivitiesInWeek(4);
      const result = GoalAdjustmentService.evaluateDifficulty(activities, "medium");
      expect(result.adjusted).toBe(false);
      expect(result.newDifficulty).toBe("medium");
    });

    it("makes no adjustment with 3 actions on easy", () => {
      const activities = makeActivitiesInWeek(3);
      const result = GoalAdjustmentService.evaluateDifficulty(activities, "easy");
      expect(result.adjusted).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("only counts activities within the last 7 days (ignores older)", () => {
      const oldActivities = makeOldActivities(10);
      const result = GoalAdjustmentService.evaluateDifficulty(oldActivities, "medium");
      // 0 activities in last 7 days → should reduce difficulty
      expect(result.adjusted).toBe(true);
      expect(result.newDifficulty).toBe("easy");
    });

    it("handles empty activity array gracefully", () => {
      const result = GoalAdjustmentService.evaluateDifficulty([], "medium");
      expect(result.adjusted).toBe(true);
      expect(result.newDifficulty).toBe("easy");
    });
  });
});
