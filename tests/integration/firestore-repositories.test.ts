import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EcoActivity } from "@/domain/activity/types";
import type { AiRecommendation } from "@/domain/insight/types";
import type { EcoScoreUser } from "@/domain/user/types";

const firestore = vi.hoisted(() => {
  let generatedDocId = "generated-id";
  const state = {
    collection: vi.fn((...path: unknown[]) => ({ kind: "collection", path })),
    doc: vi.fn((...path: unknown[]) => {
      const isGeneratedDoc = path.length === 1;
      return { kind: "doc", path, id: isGeneratedDoc ? generatedDocId : String(path.at(-1)) };
    }),
    query: vi.fn((source: unknown, ...constraints: unknown[]) => ({ source, constraints })),
    where: vi.fn((field: string, op: string, value: unknown) => ({ type: "where", field, op, value })),
    orderBy: vi.fn((field: string, direction?: string) => ({ type: "orderBy", field, direction })),
    limit: vi.fn((count: number) => ({ type: "limit", count })),
    startAfter: vi.fn((doc: unknown) => ({ type: "startAfter", doc })),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    addDoc: vi.fn(),
    onSnapshot: vi.fn(),
    setGeneratedDocId: (id: string) => {
      generatedDocId = id;
    },
  };
  return state;
});

vi.mock("@/services/firebase", () => ({
  db: { app: "mock-firestore" },
}));

vi.mock("firebase/firestore", () => ({
  collection: firestore.collection,
  doc: firestore.doc,
  query: firestore.query,
  where: firestore.where,
  orderBy: firestore.orderBy,
  limit: firestore.limit,
  startAfter: firestore.startAfter,
  getDocs: firestore.getDocs,
  getDoc: firestore.getDoc,
  setDoc: firestore.setDoc,
  updateDoc: firestore.updateDoc,
  addDoc: firestore.addDoc,
  onSnapshot: firestore.onSnapshot,
}));

function docSnap(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
    exists: () => true,
  };
}

function querySnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    docs: docs.map((doc) => docSnap(doc.id, doc.data)),
  };
}

describe("Firestore repository integrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestore.setGeneratedDocId("generated-id");
    firestore.getDocs.mockResolvedValue(querySnap([]));
    firestore.getDoc.mockResolvedValue({ exists: () => false, data: () => undefined });
    firestore.setDoc.mockResolvedValue(undefined);
    firestore.updateDoc.mockResolvedValue(undefined);
    firestore.addDoc.mockResolvedValue({ id: "added-id" });
    firestore.onSnapshot.mockReturnValue(() => undefined);
  });

  describe("ActivityRepository", () => {
    it("writes an activity without duplicating the generated id in Firestore", async () => {
      firestore.setGeneratedDocId("activity-new");
      const { ActivityRepository } = await import("@/repositories/activity.repository");
      const activity: Omit<EcoActivity, "id"> = {
        userId: "user-1",
        category: "transport",
        actionType: "Metro",
        ecoPoints: 15,
        carbonSaved: 1.2,
        createdAt: 1000,
      };

      const saved = await ActivityRepository.logActivity(activity);

      expect(saved).toEqual({ id: "activity-new", ...activity });
      expect(firestore.collection).toHaveBeenCalledWith({ app: "mock-firestore" }, "activities");
      expect(firestore.setDoc).toHaveBeenCalledWith(expect.anything(), activity);
    });

    it("maps recent activity snapshots and applies user/order/limit query constraints", async () => {
      const { ActivityRepository } = await import("@/repositories/activity.repository");
      firestore.getDocs.mockResolvedValueOnce(
        querySnap([
          {
            id: "act-1",
            data: {
              userId: "user-1",
              category: "food",
              actionType: "Vegetarian Meal",
              ecoPoints: 10,
              carbonSaved: 0.8,
              createdAt: 3000,
            },
          },
        ])
      );

      const activities = await ActivityRepository.getRecentActivities("user-1", 5);

      expect(activities).toEqual([
        expect.objectContaining({ id: "act-1", actionType: "Vegetarian Meal" }),
      ]);
      expect(firestore.where).toHaveBeenCalledWith("userId", "==", "user-1");
      expect(firestore.orderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(firestore.limit).toHaveBeenCalledWith(5);
    });

    it("filters activity history by inclusive date range after the repository read", async () => {
      const { ActivityRepository } = await import("@/repositories/activity.repository");
      firestore.getDocs.mockResolvedValueOnce(
        querySnap([
          {
            id: "old",
            data: {
              userId: "user-1",
              category: "energy",
              actionType: "Reduced AC Usage",
              ecoPoints: 10,
              carbonSaved: 0.6,
              createdAt: 50,
            },
          },
          {
            id: "inside",
            data: {
              userId: "user-1",
              category: "transport",
              actionType: "Bus",
              ecoPoints: 10,
              carbonSaved: 0.8,
              createdAt: 150,
            },
          },
        ])
      );

      const activities = await ActivityRepository.getActivities("user-1", 100, 200);

      expect(activities).toHaveLength(1);
      expect(activities[0].id).toBe("inside");
    });

    it("subscribes to realtime activities and returns the Firestore unsubscribe function", async () => {
      const unsubscribe = vi.fn();
      const { ActivityRepository } = await import("@/repositories/activity.repository");
      firestore.onSnapshot.mockImplementationOnce((_query, callback) => {
        callback(
          querySnap([
            {
              id: "act-live",
              data: {
                userId: "user-1",
                category: "transport",
                actionType: "Walked",
                ecoPoints: 15,
                carbonSaved: 1.5,
                createdAt: 400,
              },
            },
          ])
        );
        return unsubscribe;
      });
      const callback = vi.fn();

      const returned = ActivityRepository.listenToActivities("user-1", callback);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({ id: "act-live", actionType: "Walked" }),
      ]);
      expect(returned).toBe(unsubscribe);
    });
  });

  describe("UserRepository", () => {
    it("returns null for a missing user document", async () => {
      const { UserRepository } = await import("@/repositories/user.repository");

      await expect(UserRepository.getUser("missing-user")).resolves.toBeNull();
    });

    it("creates user metadata and omits uid from the Firestore payload", async () => {
      const { UserRepository } = await import("@/repositories/user.repository");
      const userData: Omit<EcoScoreUser, "uid" | "metadata"> = {
        profile: {
          name: "New User",
          email: "new@example.com",
          avatar: null,
          city: "",
          country: "",
          language: "en",
        },
        sustainability: {
          dietType: "mixed",
          transportType: "mixed",
          homeType: "apartment",
        },
        goals: {
          reduceTransport: false,
          reduceFood: false,
          reduceEnergy: false,
          buildHabits: false,
          learnSustainability: false,
        },
        score: {
          ecoScore: 0,
          level: 1,
          streak: 0,
        },
      };

      const created = await UserRepository.createUser("new-user", userData);
      const persisted = firestore.setDoc.mock.calls[0][1] as Record<string, unknown>;

      expect(created.uid).toBe("new-user");
      expect(persisted).not.toHaveProperty("uid");
      expect(persisted).toHaveProperty("metadata");
    });

    it("flattens profile and onboarding writes for partial updates", async () => {
      const { UserRepository } = await import("@/repositories/user.repository");

      await UserRepository.saveProfile("user-1", { city: "Pune", country: "India" });
      await UserRepository.saveOnboarding("user-1", {
        sustainability: {
          dietType: "vegan",
          transportType: "bicycle",
          homeType: "shared",
        },
        goals: {
          reduceTransport: true,
          reduceFood: true,
          reduceEnergy: true,
          buildHabits: false,
          learnSustainability: false,
        },
        score: {
          ecoScore: 1000,
          level: 4,
          streak: 0,
        },
        profile: {
          city: "Mumbai",
          country: "India",
        },
      });

      expect(firestore.updateDoc).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.objectContaining({
          "profile.city": "Pune",
          "profile.country": "India",
          "metadata.updatedAt": expect.any(Number),
        })
      );
      expect(firestore.updateDoc).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({
          "profile.city": "Mumbai",
          "profile.country": "India",
          score: expect.objectContaining({ ecoScore: 1000 }),
        })
      );
    });
  });

  describe("ChallengeRepository", () => {
    it("writes challenge completions under the user challenge subcollection", async () => {
      const { ChallengeRepository } = await import("@/repositories/challenge.repository");

      await ChallengeRepository.completeChallenge("user-1", "challenge_transport");

      expect(firestore.collection).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "doc" }),
        "challenges"
      );
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          challengeId: "challenge_transport",
          completed: true,
          completedAt: expect.any(Number),
        })
      );
    });

    it("maps realtime challenge completion snapshots into a boolean lookup", async () => {
      const { ChallengeRepository } = await import("@/repositories/challenge.repository");
      firestore.onSnapshot.mockImplementationOnce((_query, callback) => {
        callback(
          querySnap([
            {
              id: "challenge_transport",
              data: {
                challengeId: "challenge_transport",
                completed: true,
                completedAt: 1000,
              },
            },
            {
              id: "challenge_ac",
              data: {
                challengeId: "challenge_ac",
                completed: false,
                completedAt: 2000,
              },
            },
          ])
        );
        return () => undefined;
      });
      const callback = vi.fn();

      ChallengeRepository.listenToCompletions("user-1", callback);

      expect(callback).toHaveBeenCalledWith({
        challenge_transport: true,
        challenge_ac: false,
      });
    });
  });

  describe("RecommendationRepository", () => {
    const recommendation: Omit<AiRecommendation, "id"> = {
      userId: "user-1",
      category: "energy",
      action: "Reduce AC usage",
      reason: "Save energy",
      estimatedCarbonSaved: 0.6,
      estimatedPoints: 10,
      accepted: null,
      generatedAt: 1000,
    };

    it("saves recommendation batches and returns generated Firestore ids", async () => {
      const { RecommendationRepository } = await import("@/repositories/recommendation.repository");
      firestore.addDoc.mockResolvedValueOnce({ id: "rec-new" });

      const saved = await RecommendationRepository.saveRecommendations([recommendation]);

      expect(saved).toEqual([{ id: "rec-new", ...recommendation }]);
      expect(firestore.addDoc).toHaveBeenCalledWith(expect.anything(), recommendation);
    });

    it("accepts and dismisses recommendations with the expected update payloads", async () => {
      const { RecommendationRepository } = await import("@/repositories/recommendation.repository");

      await RecommendationRepository.acceptRecommendation("rec-1");
      await RecommendationRepository.dismissRecommendation("rec-2");

      expect(firestore.updateDoc).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.objectContaining({ accepted: true, acceptedAt: expect.any(Number) })
      );
      expect(firestore.updateDoc).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        { accepted: false }
      );
    });

    it("propagates Firestore read failures for active recommendations", async () => {
      const { RecommendationRepository } = await import("@/repositories/recommendation.repository");
      firestore.getDocs.mockRejectedValueOnce(new Error("network unavailable"));

      await expect(RecommendationRepository.getActiveRecommendations("user-1")).rejects.toThrow(
        "network unavailable"
      );
    });
  });
});
