import { describe, it, expect, vi, beforeEach } from "vitest";
import { SimulatorService, SIMULATOR_SCENARIOS } from "@/services/simulator.service";

// ─── Mock Gemini (used for AI narrative) ─────────────────────────────────────
vi.mock("@/services/gemini", () => ({
  gemini: {
    generateText: vi.fn().mockResolvedValue("This is an AI explanation for the simulation."),
  },
}));

const METRO_SCENARIO = SIMULATOR_SCENARIOS.find((s) => s.id === "metro_vs_car")!;
const AC_SCENARIO = SIMULATOR_SCENARIOS.find((s) => s.id === "reduce_ac_30min")!;
const VEG_SCENARIO = SIMULATOR_SCENARIOS.find((s) => s.id === "vegetarian_twice_weekly")!;

describe("SimulatorService — getScenarios", () => {
  it("returns all 10 scenarios", () => {
    expect(SimulatorService.getScenarios()).toHaveLength(10);
  });

  it("returns null for unknown scenario ID", () => {
    expect(SimulatorService.getScenario("unknown_scenario")).toBeNull();
  });

  it("retrieves correct scenario by ID", () => {
    const s = SimulatorService.getScenario("metro_vs_car");
    expect(s).not.toBeNull();
    expect(s!.label).toBe("Metro instead of Car");
    expect(s!.category).toBe("transport");
  });
});

describe("SimulatorService — calculate (transport: metro_vs_car)", () => {
  let result: ReturnType<typeof SimulatorService.calculate>;

  beforeEach(() => {
    result = SimulatorService.calculate(METRO_SCENARIO, 500);
  });

  it("calculates correct annual carbon saved", () => {
    // 5 trips/week × 52 weeks × 2.1 kg = 546 kg
    expect(result.annualCarbonSaved).toBeCloseTo(546, 0);
  });

  it("calculates correct monthly carbon saved", () => {
    expect(result.monthlyCarbonSaved).toBeCloseTo(45.5, 0);
  });

  it("calculates annual money saved correctly", () => {
    // 5 × 52 × ₹120 = ₹31,200
    expect(result.annualMoneySaved).toBe(31200);
  });

  it("calculates tree equivalent using 21 kg/tree/year", () => {
    // 546 / 21 ≈ 26 trees
    expect(result.treeEquivalent).toBeGreaterThan(20);
  });

  it("calculates car km equivalent using 0.21 kg/km", () => {
    // 546 / 0.21 ≈ 2600 km
    expect(result.carKmEquivalent).toBeGreaterThan(2000);
  });

  it("caps EcoScore improvement at 1000", () => {
    const maxResult = SimulatorService.calculate(METRO_SCENARIO, 999);
    expect(maxResult.ecoScoreImpact).toBe(1);
  });

  it("returns non-negative EcoScore impact", () => {
    expect(result.ecoScoreImpact).toBeGreaterThanOrEqual(0);
  });
});

describe("SimulatorService — calculate (energy: reduce_ac_30min)", () => {
  it("calculates correct annual carbon for daily AC reduction", () => {
    const result = SimulatorService.calculate(AC_SCENARIO, 300);
    // 7 × 52 × 0.6 = 218.4
    expect(result.annualCarbonSaved).toBeCloseTo(218.4, 1);
  });
});

describe("SimulatorService — calculate (food: vegetarian_twice_weekly)", () => {
  it("calculates correct annual carbon for 2x vegetarian meals", () => {
    const result = SimulatorService.calculate(VEG_SCENARIO, 300);
    // 2 × 52 × 1.5 = 156
    expect(result.annualCarbonSaved).toBeCloseTo(156, 0);
  });
});

describe("SimulatorService — getAiExplanation", () => {
  it("returns a non-empty AI explanation string", async () => {
    const result = SimulatorService.calculate(METRO_SCENARIO, 500);
    const explanation = await SimulatorService.getAiExplanation(METRO_SCENARIO, result);
    expect(explanation).toBeTruthy();
    expect(typeof explanation).toBe("string");
  });

  it("returns fallback explanation when Gemini throws", async () => {
    const { gemini } = await import("@/services/gemini");
    vi.mocked(gemini.generateText).mockRejectedValueOnce(new Error("API error"));

    const result = SimulatorService.calculate(METRO_SCENARIO, 500);
    const explanation = await SimulatorService.getAiExplanation(METRO_SCENARIO, result);
    expect(explanation).toContain("546"); // fallback uses annualCarbonSaved
  });
});
