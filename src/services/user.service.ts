import { UserRepository } from "@/repositories/user.repository";
import { EcoScoreService } from "./eco-score.service";
import { OnboardingDataSchema, type OnboardingDataInput } from "@/domain/user/schemas";
import { trackEvent } from "./analytics";
import type { EcoScoreUser } from "@/domain/user/types";
import type { EcoScoreResult } from "@/domain/eco-score/types";

export const UserService = {
  async getUser(userId: string): Promise<EcoScoreUser | null> {
    // Check for demo mode first
    if (typeof window !== "undefined" && userId === "test-eco-user-id") {
      const demoSession = localStorage.getItem("_demo_auth_user");
      if (demoSession) {
        // Return hardcoded demo user profile
        return {
          uid: userId,
          profile: {
            name: "Test Eco User",
            email: "test@ecoscore.com",
            avatar: null,
            city: "San Francisco",
            country: "United States",
            language: "en",
          },
          sustainability: {
            dietType: "mixed",
            transportType: "metro",
            homeType: "apartment",
          },
          score: {
            ecoScore: 580,
            level: 3,
            streak: 4,
            lastActivityAt: Date.now() - 24 * 60 * 60 * 1000,
            goalDifficulty: "medium",
          },
          goals: {
            reduceTransport: true,
            reduceFood: true,
            reduceEnergy: true,
            buildHabits: true,
            learnSustainability: true,
          },
          metadata: {
            createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now(),
          },
        };
      }
    }

    return UserRepository.getUser(userId);
  },

  async createUserShell(
    userId: string,
    email: string | null,
    name: string | null
  ): Promise<EcoScoreUser> {
    const defaultData: Omit<EcoScoreUser, "uid" | "metadata"> = {
      profile: {
        name: name || "Eco User",
        email: email,
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

    return UserRepository.createUser(userId, defaultData);
  },

  async submitOnboarding(userId: string, data: OnboardingDataInput): Promise<EcoScoreResult> {
    trackEvent("onboarding_started", { userId });

    // 1. Strict Validation
    const parsedData = OnboardingDataSchema.safeParse(data);
    if (!parsedData.success) {
      throw new Error(`Onboarding validation failed: ${parsedData.error.message}`);
    }

    const { sustainability, goals, profile } = parsedData.data;

    // 2. Score Calculation
    const result = EcoScoreService.calculateInitialEcoScore(
      sustainability.dietType,
      sustainability.transportType,
      sustainability.homeType
    );

    // 3. Save to Firestore
    await UserRepository.saveOnboarding(userId, {
      sustainability,
      goals,
      score: {
        ecoScore: result.score,
        level: result.level,
        streak: 0, // Reset/start streak at 0
      },
      profile: {
        city: profile.city,
        country: profile.country,
      },
    });

    // 4. Fire Telemetry
    trackEvent("onboarding_completed", {
      userId,
      score: result.score,
      level: result.level,
    });

    trackEvent("ecoscore_generated", {
      userId,
      score: result.score,
      level: result.level,
    });

    return result;
  },
};

export default UserService;
