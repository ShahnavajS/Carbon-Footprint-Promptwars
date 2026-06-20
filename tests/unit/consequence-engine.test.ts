import { describe, it, expect } from "vitest";
import { projectConsequences } from "@/lib/consequence-engine";

describe("consequence-engine projectConsequences", () => {
  it("projects three scenarios from a weekly baseline", () => {
    const result = projectConsequences({ weeklyCarbonSavedKg: 5, streak: 7 });
    expect(result.optimistic.scenario).toBe("optimistic");
    expect(result.steady.scenario).toBe("steady");
    expect(result.lapse.scenario).toBe("lapse");
  });

  it("steady equals baseline × 52 weeks", () => {
    const result = projectConsequences({ weeklyCarbonSavedKg: 10, streak: 0 });
    expect(result.steady.annualCarbonKg).toBe(10 * 52);
  });

  it("optimistic multiplies by streak-driven momentum (>= steady)", () => {
    const result = projectConsequences({ weeklyCarbonSavedKg: 10, streak: 10 });
    expect(result.optimistic.annualCarbonKg).toBeGreaterThanOrEqual(result.steady.annualCarbonKg);
  });

  it("lapse is strictly less than steady (forgo framing)", () => {
    const result = projectConsequences({ weeklyCarbonSavedKg: 10, streak: 0 });
    expect(result.lapse.annualCarbonKg).toBeLessThan(result.steady.annualCarbonKg);
  });

  it("computes tangible equivalents with documented constants", () => {
    const result = projectConsequences({ weeklyCarbonSavedKg: 10, streak: 0 });
    // 10 kg/wk × 52 = 520 kg/yr. Tree = 520/22 ≈ 24. Car-km = 520/0.2 = 2600.
    expect(result.steady.equivalents.treesYear).toBe(Math.round(520 / 22));
    expect(result.steady.equivalents.carKm).toBe(Math.round(520 / 0.2));
    expect(result.steady.equivalents.balloons).toBe(Math.round(520 * 39));
  });

  it("never returns negative numbers for a zero baseline", () => {
    const result = projectConsequences({ weeklyCarbonSavedKg: 0, streak: 0 });
    expect(result.optimistic.annualCarbonKg).toBe(0);
    expect(result.lapse.equivalents.treesYear).toBe(0);
  });

  it("uses hope-forward labels (no doom language)", () => {
    const result = projectConsequences({ weeklyCarbonSavedKg: 5, streak: 3 });
    for (const label of [
      result.optimistic.label,
      result.steady.label,
      result.lapse.label,
    ]) {
      expect(label.toLowerCase()).not.toMatch(/doom|catastrophe|destroy|hopeless/);
    }
  });
});
