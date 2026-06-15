import { describe, expect, it } from "vitest";
import { EcoScoreService } from "@/services/eco-score.service";
import type { DietType, HomeType, TransportType } from "@/domain/user/types";

describe("EcoScore engine boundaries", () => {
  it.each([
    ["lowest-impact baseline", "high-meat", "car", "house", 0, 1],
    ["lower mid baseline", "mixed", "car", "house", 143, 1],
    ["green citizen baseline", "mixed", "mixed", "house", 357, 2],
    ["advocate baseline", "vegetarian", "mixed", "apartment", 607, 3],
    ["champion baseline", "vegan", "walk", "shared", 1000, 4],
  ] as const)(
    "calculates %s as a bounded score and level",
    (_label, diet, transport, home, score, level) => {
      const result = EcoScoreService.calculateInitialEcoScore(diet, transport, home);

      expect(result.score).toBe(score);
      expect(result.level).toBe(level);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1000);
      expect(result.explanation).toContain(`${score}/1000`);
      expect(result.explanation).toContain(`Level ${level}`);
    }
  );

  it("falls back to conservative defaults for invalid enum values without throwing", () => {
    const result = EcoScoreService.calculateInitialEcoScore(
      "unknown-diet" as DietType,
      "spaceship" as TransportType,
      "castle" as HomeType
    );

    expect(result).toMatchObject({
      score: 0,
      level: 1,
    });
    expect(result.explanation).toContain("+20 points");
    expect(result.explanation).toContain("+50 points");
  });

  it("keeps every valid onboarding combination inside the public 0-1000 contract", () => {
    const diets: DietType[] = ["vegan", "vegetarian", "mixed", "high-meat"];
    const transports: TransportType[] = ["walk", "bicycle", "metro", "bus", "mixed", "car"];
    const homes: HomeType[] = ["shared", "apartment", "house"];

    for (const diet of diets) {
      for (const transport of transports) {
        for (const home of homes) {
          const result = EcoScoreService.calculateInitialEcoScore(diet, transport, home);
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(1000);
          expect(result.level).toBeGreaterThanOrEqual(1);
          expect(result.level).toBeLessThanOrEqual(4);
        }
      }
    }
  });
});
