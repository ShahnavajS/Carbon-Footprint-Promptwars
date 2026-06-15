import { describe, it, expect, vi, beforeEach } from "vitest";
import { InsightService } from "@/services/insight.service";
import { GeminiInsightSchema, GeminiRecommendationsSchema } from "@/domain/insight/schemas";
import type { EcoActivity } from "@/domain/activity/types";
import type { EcoScoreUser } from "@/domain/user/types";

// Mock Gemini
vi.mock("@/services/gemini", () => ({
  gemini: {
    generateInsightJSON: vi.fn(),
    generateRecommendationsJSON: vi.fn(),
  },
}));

// Mock Firebase Admin
vi.mock("@/lib/firebase-admin", () => {
  const mockDb = {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        id: "insight_mock_123",
        set: vi.fn(() => Promise.resolve()),
      })),
    })),
  };
  return {
    adminDb: mockDb,
    adminAuth: {},
    adminApp: {},
  };
});

// Mock repositories
vi.mock("@/repositories/insight.repository", () => ({
  InsightRepository: {
    saveInsight: vi.fn((x) => Promise.resolve({ id: "insight_mock_123", ...x })),
  },
}));

vi.mock("@/repositories/recommendation.repository", () => ({
  RecommendationRepository: {
    saveRecommendations: vi.fn((recs: Record<string, unknown>[]) =>
      Promise.resolve(recs.map((r, idx: number) => ({ id: `rec_mock_${idx}`, ...r })))
    ),
  },
}));

// Mock analytics
vi.mock("@/services/analytics", () => ({
  trackEvent: vi.fn(),
}));

describe("InsightEngine & Zod Schemas", () => {
  const mockUser: EcoScoreUser = {
    uid: "user_test_123",
    profile: {
      name: "Alice Eco",
      email: "test@example.com",
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
      ecoScore: 450,
      level: 2,
      streak: 5,
      lastActivityAt: Date.now(),
      goalDifficulty: "medium",
    },
    goals: {
      reduceTransport: true,
      reduceFood: true,
      reduceEnergy: true,
      buildHabits: false,
      learnSustainability: false,
    },
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  };

  const mockActivities: EcoActivity[] = [
    {
      id: "act1",
      userId: "user_test_123",
      category: "transport",
      actionType: "Metro",
      ecoPoints: 15,
      carbonSaved: 2.1,
      createdAt: Date.now(),
    },
    {
      id: "act2",
      userId: "user_test_123",
      category: "food",
      actionType: "Vegetarian Meal",
      ecoPoints: 10,
      carbonSaved: 1.5,
      createdAt: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Zod Schema Validation", () => {
    it("validates correct weekly insight JSON payload", () => {
      const validPayload = {
        title: "Sailing Steady",
        summary: "You had a great week using public transit. Keep it up!",
        biggestWin: "Saved 2.1kg CO2 by riding the metro.",
        improvementArea: "Try turning off your AC when not in the room.",
        nextStep: "Line dry your clothes this week.",
      };
      const parsed = GeminiInsightSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
    });

    it("rejects incomplete weekly insight JSON payload", () => {
      const invalidPayload = {
        title: "Sailing Steady",
        summary: "Missing some fields",
      };
      const parsed = GeminiInsightSchema.safeParse(invalidPayload);
      expect(parsed.success).toBe(false);
    });

    it("validates correct recommendation list payload", () => {
      const validPayload = [
        {
          action: "Use AC 30 mins less",
          reason: "Saves grid energy during peak hours.",
          category: "energy",
          estimatedCarbonSaved: 0.6,
          estimatedPoints: 10,
        },
        {
          action: "One vegan meal",
          reason: "Reduces footprint compared to meat.",
          category: "food",
          estimatedCarbonSaved: 2.0,
          estimatedPoints: 15,
        },
      ];
      const parsed = GeminiRecommendationsSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid category in recommendation list", () => {
      const invalidPayload = [
        {
          action: "Use AC 30 mins less",
          reason: "Saves grid energy.",
          category: "invalid-category",
          estimatedCarbonSaved: 0.6,
          estimatedPoints: 10,
        },
      ];
      const parsed = GeminiRecommendationsSchema.safeParse(invalidPayload);
      expect(parsed.success).toBe(false);
    });
  });

  describe("InsightService — generateAndSaveWeeklyInsight", () => {
    it("calls Gemini with a prompt and parses/saves the result successfully", async () => {
      const { gemini } = await import("@/services/gemini");
      const mockResponse = JSON.stringify({
        title: "Green Commuter Superstar",
        summary: "Great job taking the metro. Your transport choices saved 2.1kg CO2.",
        biggestWin: "Saving 2.1kg CO2 by avoiding car rides.",
        improvementArea: "Consider plant-based dinner swaps.",
        nextStep: "Eat two vegetarian dinners this week.",
      });
      vi.mocked(gemini.generateInsightJSON).mockResolvedValue(mockResponse);

      const result = await InsightService.generateAndSaveWeeklyInsight(mockUser, mockActivities);

      expect(gemini.generateInsightJSON).toHaveBeenCalled();
      expect(result.id).toBe("insight_mock_123");
      expect(result.title).toBe("Green Commuter Superstar");
      expect(result.biggestWin).toBe("Saving 2.1kg CO2 by avoiding car rides.");
    });

    it("propagates error when Zod validation fails on bad JSON", async () => {
      const { gemini } = await import("@/services/gemini");
      const badResponse = JSON.stringify({
        summary: "Incomplete JSON",
      });
      vi.mocked(gemini.generateInsightJSON).mockResolvedValue(badResponse);

      await expect(
        InsightService.generateAndSaveWeeklyInsight(mockUser, mockActivities)
      ).rejects.toThrow();
    });
  });

  describe("InsightService — generateAndSaveRecommendations", () => {
    it("calls Gemini and parses/saves 3 recommendations successfully", async () => {
      const { gemini } = await import("@/services/gemini");
      const mockResponse = JSON.stringify([
        {
          action: "Turn off AC 30 mins/day",
          reason: "Reduces your high home cooling emissions.",
          category: "energy",
          estimatedCarbonSaved: 0.6,
          estimatedPoints: 10,
        },
        {
          action: "Bicycle to work once",
          reason: "Saves fuel cost and transport carbon.",
          category: "transport",
          estimatedCarbonSaved: 0.2,
          estimatedPoints: 15,
        },
        {
          action: "Vegan dinner once",
          reason: "Reduces diet footprint.",
          category: "food",
          estimatedCarbonSaved: 2.0,
          estimatedPoints: 15,
        },
      ]);
      vi.mocked(gemini.generateRecommendationsJSON).mockResolvedValue(mockResponse);

      const result = await InsightService.generateAndSaveRecommendations(mockUser, mockActivities);

      expect(gemini.generateRecommendationsJSON).toHaveBeenCalled();
      expect(result).toHaveLength(3);
      expect(result[0].action).toBe("Turn off AC 30 mins/day");
      expect(result[1].category).toBe("transport");
    });
  });
});
