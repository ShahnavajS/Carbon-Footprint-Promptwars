import { describe, expect, it } from "vitest";
import { StreakService } from "@/services/streak.service";

describe("Streak engine edge cases", () => {
  it("treats a missing timestamp value of zero as first activity", () => {
    const now = new Date("2026-06-15T10:00:00.000Z").getTime();

    const result = StreakService.calculateStreak(0, 12, 20, now);

    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(20);
    expect(result.lastActivityAt).toBe(now);
  });

  it("increments across a month boundary when the previous activity was yesterday", () => {
    const lastActivity = new Date(2026, 4, 31, 9, 0, 0).getTime();
    const now = new Date(2026, 5, 1, 9, 0, 0).getTime();

    const result = StreakService.calculateStreak(lastActivity, 4, 4, now);

    expect(result.currentStreak).toBe(5);
    expect(result.bestStreak).toBe(5);
    expect(result.lastActivityAt).toBe(now);
  });

  it("increments across a year boundary when the previous activity was yesterday", () => {
    const lastActivity = new Date(2025, 11, 31, 9, 0, 0).getTime();
    const now = new Date(2026, 0, 1, 9, 0, 0).getTime();

    const result = StreakService.calculateStreak(lastActivity, 9, 12, now);

    expect(result.currentStreak).toBe(10);
    expect(result.bestStreak).toBe(12);
  });

  it("keeps the first same-day timestamp so multiple logs do not move the streak anchor", () => {
    const firstLog = new Date(2026, 5, 15, 8, 0, 0).getTime();
    const secondLog = new Date(2026, 5, 15, 18, 30, 0).getTime();

    const result = StreakService.calculateStreak(firstLog, 3, 7, secondLog);

    expect(result.currentStreak).toBe(3);
    expect(result.bestStreak).toBe(7);
    expect(result.lastActivityAt).toBe(firstLog);
  });
});
