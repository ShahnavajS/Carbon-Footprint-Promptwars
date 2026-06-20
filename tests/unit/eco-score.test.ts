import { describe, it, expect } from "vitest";
import { EcoScoreService } from "@/services/eco-score.service";

describe("EcoScore Service Calculations", () => {
  it("calculates minimum score correctly and normalizes it to 0", () => {
    // High Meat (+20) + Car (+20) + House (+50) = 90 (Min raw score)
    const result = EcoScoreService.calculateInitialEcoScore("high-meat", "car", "house");
    expect(result.score).toBe(0);
    expect(result.level).toBe(1);
    expect(result.explanation).toContain("Level 1");
    expect(result.explanation).toContain("High Meat");
    expect(result.explanation).toContain("Car");
    expect(result.explanation).toContain("House");
  });

  it("calculates maximum score correctly and normalizes it to 1000", () => {
    // Vegan (+120) + Walk (+150) + Shared (+100) = 370 (Max raw score)
    const result = EcoScoreService.calculateInitialEcoScore("vegan", "walk", "shared");
    expect(result.score).toBe(1000);
    // Unified 5-level system: 800-1000 = Level 5 (Climate Champion)
    expect(result.level).toBe(5);
    expect(result.explanation).toContain("Level 5");
    expect(result.explanation).toContain("Vegan");
    expect(result.explanation).toContain("Walk");
    expect(result.explanation).toContain("Shared");
  });

  it("calculates mixed/intermediate scores accurately within normal limits", () => {
    // Vegetarian (+100) + Bus (+100) + Apartment (+80) = 280 (Raw score)
    // Normalized: (280 - 90) / 280 * 1000 = 190 / 280 * 1000 = 678.57 -> 679
    const result = EcoScoreService.calculateInitialEcoScore("vegetarian", "bus", "apartment");
    expect(result.score).toBe(679);
    // Unified 5-level system: 600-799 = Level 4 (Eco Hero)
    expect(result.level).toBe(4);
    expect(result.explanation).toContain("Level 4");
  });
});
