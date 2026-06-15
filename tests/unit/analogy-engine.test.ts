import { describe, it, expect } from "vitest";
import { AnalogyEngine } from "@/lib/analogy-engine";

describe("AnalogyEngine Calculations & Text Output", () => {
  it("calculates accurate phone charges equivalent", () => {
    // 1 kg = 250 charges
    expect(AnalogyEngine.getPhoneCharges(0)).toBe(1); // Min cap
    expect(AnalogyEngine.getPhoneCharges(1)).toBe(250);
    expect(AnalogyEngine.getPhoneCharges(0.5)).toBe(125);
    expect(AnalogyEngine.getPhoneCharges(2.4)).toBe(600);
  });

  it("calculates tree absorption days", () => {
    // 1 kg = 16.7 tree days
    expect(AnalogyEngine.getTreeDays(0)).toBe(1); // Min cap
    expect(AnalogyEngine.getTreeDays(1)).toBe(17); // Rounding
    expect(AnalogyEngine.getTreeDays(10)).toBe(167);
  });

  it("calculates party balloon volume", () => {
    // 1 kg = 39 balloons
    expect(AnalogyEngine.getBalloons(0)).toBe(1); // Min cap
    expect(AnalogyEngine.getBalloons(1)).toBe(39);
    expect(AnalogyEngine.getBalloons(5)).toBe(195);
  });

  it("calculates ceiling fan running hours", () => {
    // 1 kg = 50 fan hours
    expect(AnalogyEngine.getFanHours(0)).toBe(1); // Min cap
    expect(AnalogyEngine.getFanHours(1)).toBe(50);
    expect(AnalogyEngine.getFanHours(0.2)).toBe(10);
  });

  it("calculates car driving distance avoided", () => {
    // 1 kg = 5 km
    expect(AnalogyEngine.getCarKilometers(0)).toBe(1); // Min cap
    expect(AnalogyEngine.getCarKilometers(1)).toBe(5);
    expect(AnalogyEngine.getCarKilometers(8.5)).toBe(43);
  });

  it("generates correct progressive text analogies", () => {
    // Small value (< 0.5) uses phone charges
    const smallText = AnalogyEngine.getPrimaryAnalogyText(0.2);
    expect(smallText).toContain("charge a smartphone");
    expect(smallText).toContain("50 times");

    // Medium value (0.5 to 2.0) uses balloons
    const medText = AnalogyEngine.getPrimaryAnalogyText(1.0);
    expect(medText).toContain("preventing a cloud");
    expect(medText).toContain("39 party balloons");

    // Large value (2.0 to 10.0) uses fan & trees
    const largeText = AnalogyEngine.getPrimaryAnalogyText(5.0);
    expect(largeText).toContain("carbon absorbed by a mature tree in 84 days");
    expect(largeText).toContain("running a household fan for 250 hours");

    // Extra large value (> 10.0) uses tree years & car km
    const xlText = AnalogyEngine.getPrimaryAnalogyText(20.0);
    expect(xlText).toContain("tree absorbing carbon for 334 days");
    expect(xlText).toContain("avoiding driving a typical petrol car for 100 kilometers");
  });

  it("returns breakdown array with correct length and types", () => {
    const breakdown = AnalogyEngine.getAnalogyBreakdown(2.5);
    expect(breakdown).toHaveLength(5);
    expect(breakdown.map((item) => item.type)).toEqual([
      "phone",
      "tree",
      "balloon",
      "fan",
      "car",
    ]);
  });
});
