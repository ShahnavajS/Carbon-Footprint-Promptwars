import { beforeEach, describe, expect, it, vi } from "vitest";
import { SimulatorService, SIMULATOR_SCENARIOS } from "@/services/simulator.service";

vi.mock("@/services/gemini", () => ({
  gemini: {
    generateText: vi.fn(),
  },
}));

const scenario = SIMULATOR_SCENARIOS.find((item) => item.id === "switch_off_standby")!;

describe("Simulator calculation edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zero EcoScore impact when the user is already at the score cap", () => {
    const result = SimulatorService.calculate(scenario, 1000);

    expect(result.ecoScoreImpact).toBe(0);
    expect(result.annualCarbonSaved).toBe(145.6);
    expect(result.monthlyCarbonSaved).toBe(12.13);
    expect(result.annualMoneySaved).toBe(2912);
  });

  it("allows negative current score inputs to surface as large impact without mutating scenario data", () => {
    const before = { ...scenario };

    const result = SimulatorService.calculate(scenario, -25);

    expect(result.ecoScoreImpact).toBeGreaterThan(0);
    expect(result.scenario).toEqual(before);
    expect(scenario).toEqual(before);
  });

  it("normalizes AI explanations by trimming newlines and limiting length", async () => {
    const { gemini } = await import("@/services/gemini");
    vi.mocked(gemini.generateText).mockResolvedValueOnce(`  Line one.\n\nLine two.${"x".repeat(400)}`);

    const result = SimulatorService.calculate(scenario, 400);
    const explanation = await SimulatorService.getAiExplanation(scenario, result);

    expect(explanation).not.toContain("\n");
    expect(explanation).toHaveLength(300);
    expect(explanation.startsWith("Line one. Line two.")).toBe(true);
  });

  it("falls back to deterministic copy when Gemini returns a rejected promise", async () => {
    const { gemini } = await import("@/services/gemini");
    vi.mocked(gemini.generateText).mockRejectedValueOnce(new Error("Gemini unavailable"));

    const result = SimulatorService.calculate(scenario, 400);
    const explanation = await SimulatorService.getAiExplanation(scenario, result);

    expect(explanation).toContain(`${scenario.weeklyFrequency}`);
    expect(explanation).toContain(`${result.annualCarbonSaved}`);
    expect(explanation).toContain("trees");
  });
});
