import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EcoScoreUser } from "@/domain/user/types";

const authState = vi.hoisted(() => ({
  user: null as { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null,
  dbUser: null as EcoScoreUser | null,
}));

vi.mock("@/features/auth/store", () => ({
  useAuthStore: vi.fn(() => authState),
}));

vi.mock("@/services/analytics", () => ({
  trackEvent: vi.fn(),
}));

describe("useSimulator integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = {
      uid: "user-1",
      email: "user@example.com",
      displayName: "User",
      photoURL: null,
    };
    authState.dbUser = {
      uid: "user-1",
      profile: {
        name: "User",
        email: "user@example.com",
        avatar: null,
        city: "Delhi",
        country: "India",
        language: "en",
      },
      sustainability: {
        dietType: "mixed",
        transportType: "car",
        homeType: "apartment",
      },
      goals: {
        reduceTransport: true,
        reduceFood: false,
        reduceEnergy: false,
        buildHabits: false,
        learnSustainability: false,
      },
      score: {
        ecoScore: 580,
        level: 3,
        streak: 4,
      },
      metadata: {
        createdAt: 1,
        updatedAt: 2,
      },
    };
    global.fetch = vi.fn();
  });

  it("runs a selected scenario through the simulate API and stores the result", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        scenario: { id: "metro_vs_car" },
        annualCarbonSaved: 546,
        monthlyCarbonSaved: 45.5,
        ecoScoreImpact: 52,
        annualMoneySaved: 31200,
        treeEquivalent: 26,
        carKmEquivalent: 2600,
        aiExplanation: "Helpful explanation",
      }),
    } as Response);
    const { useSimulator } = await import("@/hooks/use-simulator");

    const { result } = renderHook(() => useSimulator());
    act(() => result.current.selectScenario("metro_vs_car"));
    await act(async () => {
      await result.current.runSimulation();
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/ai/simulate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ scenarioId: "metro_vs_car", currentEcoScore: 580 }),
      })
    );
    expect(result.current.result).toEqual(expect.objectContaining({ annualCarbonSaved: 546 }));
    expect(result.current.error).toBeNull();
  });

  it("surfaces API error responses and clears the previous result", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Scenario not found" }),
    } as Response);
    const { useSimulator } = await import("@/hooks/use-simulator");

    const { result } = renderHook(() => useSimulator());
    act(() => result.current.selectScenario("metro_vs_car"));
    await act(async () => {
      await result.current.runSimulation();
    });

    await waitFor(() => expect(result.current.isRunning).toBe(false));
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBe("Scenario not found");
  });

  it("reset clears selection, result, and error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network failed"));
    const { useSimulator } = await import("@/hooks/use-simulator");

    const { result } = renderHook(() => useSimulator());
    act(() => result.current.selectScenario("metro_vs_car"));
    await act(async () => {
      await result.current.runSimulation();
    });
    expect(result.current.error).toBe("network failed");

    act(() => result.current.reset());

    expect(result.current.selectedScenario).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
