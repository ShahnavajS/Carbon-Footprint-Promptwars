import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const simulatorMocks = vi.hoisted(() => ({
  getScenario: vi.fn(),
  calculate: vi.fn(),
  getAiExplanation: vi.fn(),
}));

const insightMocks = vi.hoisted(() => ({
  generateAndSaveWeeklyInsight: vi.fn(),
  generateAndSaveRecommendations: vi.fn(),
}));

const adminMocks = vi.hoisted(() => ({
  userGet: vi.fn(),
  activitiesGet: vi.fn(),
}));

vi.mock("@/services/simulator.service", () => ({
  SimulatorService: simulatorMocks,
}));

vi.mock("@/services/insight.service", () => ({
  InsightService: insightMocks,
}));

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn((name: string) => {
      if (name === "users") {
        return {
          doc: vi.fn(() => ({
            get: adminMocks.userGet,
          })),
        };
      }
      return {
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: adminMocks.activitiesGet,
            })),
          })),
        })),
      };
    }),
  },
}));

vi.mock("@/services/logger.service", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function jsonRequest(body: unknown, url = "http://localhost/api/test"): NextRequest {
  return {
    url,
    json: vi.fn(async () => body),
  } as unknown as NextRequest;
}

describe("AI simulator API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    simulatorMocks.getScenario.mockReturnValue({
      id: "metro_vs_car",
      label: "Metro instead of Car",
    });
    simulatorMocks.calculate.mockReturnValue({
      annualCarbonSaved: 546,
      monthlyCarbonSaved: 45.5,
      ecoScoreImpact: 52,
      annualMoneySaved: 31200,
      treeEquivalent: 26,
      carKmEquivalent: 2600,
    });
    simulatorMocks.getAiExplanation.mockResolvedValue("AI explanation");
  });

  it("returns 400 when scenarioId is missing", async () => {
    const { POST } = await import("@/app/api/ai/simulate/route");

    const response = await POST(jsonRequest({ currentEcoScore: 300 }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "scenarioId is required" });
  });

  it("returns 404 for unknown simulator scenarios", async () => {
    simulatorMocks.getScenario.mockReturnValueOnce(null);
    const { POST } = await import("@/app/api/ai/simulate/route");

    const response = await POST(jsonRequest({ scenarioId: "unknown" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Scenario 'unknown' not found" });
  });

  it("returns deterministic calculation plus Gemini explanation for valid requests", async () => {
    const { POST } = await import("@/app/api/ai/simulate/route");

    const response = await POST(jsonRequest({ scenarioId: "metro_vs_car", currentEcoScore: 500 }));

    expect(response.status).toBe(200);
    expect(simulatorMocks.calculate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "metro_vs_car" }),
      500
    );
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        annualCarbonSaved: 546,
        aiExplanation: "AI explanation",
      })
    );
  });

  it("returns 500 when request parsing fails", async () => {
    const { POST } = await import("@/app/api/ai/simulate/route");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const request = {
      json: vi.fn(async () => {
        throw new Error("bad json");
      }),
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Simulation failed. Please try again.",
    });
    consoleError.mockRestore();
  });
});

describe("AI insights generation API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminMocks.userGet.mockResolvedValue({
      exists: true,
      data: () => ({
        profile: {
          name: "User",
          email: "user@example.com",
          avatar: null,
          city: "Delhi",
          country: "India",
          language: "en",
        },
        sustainability: {
          dietType: "vegetarian",
          transportType: "metro",
          homeType: "apartment",
        },
        score: {
          ecoScore: 500,
          level: 2,
          streak: 3,
        },
        goals: {
          reduceTransport: true,
          reduceFood: true,
          reduceEnergy: false,
          buildHabits: false,
          learnSustainability: false,
        },
        metadata: {
          createdAt: 1,
          updatedAt: 2,
        },
      }),
    });
    adminMocks.activitiesGet.mockResolvedValue({
      docs: [
        {
          id: "activity-1",
          data: () => ({
            userId: "user-1",
            category: "transport",
            actionType: "Metro",
            ecoPoints: 15,
            carbonSaved: 1.2,
            createdAt: Date.now(),
          }),
        },
      ],
    });
    insightMocks.generateAndSaveWeeklyInsight.mockResolvedValue({ id: "insight-1" });
    insightMocks.generateAndSaveRecommendations.mockResolvedValue([{ id: "rec-1" }]);
  });

  it("returns 400 when userId is missing", async () => {
    const { POST } = await import("@/app/api/ai/insights/generate/route");

    const response = await POST(jsonRequest({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "userId is required" });
  });

  it("returns cached demo insights without Firebase or Gemini calls", async () => {
    const { POST } = await import("@/app/api/ai/insights/generate/route");

    const response = await POST(jsonRequest({ userId: "test-eco-user-id" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.insight.id).toBe("demo-insight-weekly");
    expect(body.recommendations).toHaveLength(3);
    expect(adminMocks.userGet).not.toHaveBeenCalled();
  });

  it("returns 404 when the Firestore user profile is missing", async () => {
    adminMocks.userGet.mockResolvedValueOnce({ exists: false, data: () => undefined });
    const { POST } = await import("@/app/api/ai/insights/generate/route");

    const response = await POST(jsonRequest({ userId: "missing-user" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "User not found" });
  });

  it("generates weekly insight and recommendations from Firestore activity data", async () => {
    const { POST } = await import("@/app/api/ai/insights/generate/route");

    const response = await POST(jsonRequest({ userId: "user-1" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      insight: { id: "insight-1" },
      recommendations: [{ id: "rec-1" }],
    });
    expect(insightMocks.generateAndSaveWeeklyInsight).toHaveBeenCalledWith(
      expect.objectContaining({ uid: "user-1" }),
      expect.arrayContaining([expect.objectContaining({ id: "activity-1" })])
    );
    expect(insightMocks.generateAndSaveRecommendations).toHaveBeenCalled();
  });

  it("returns fallback recommendations with 202 when Firestore or Gemini fails", async () => {
    adminMocks.activitiesGet.mockRejectedValueOnce(new Error("Firestore unavailable"));
    const { POST } = await import("@/app/api/ai/insights/generate/route");

    const response = await POST(jsonRequest({ userId: "user-1" }));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.insight).toBeNull();
    expect(body.recommendations).toHaveLength(3);
    expect(body.message).toContain("cached recommendations");
  });
});
