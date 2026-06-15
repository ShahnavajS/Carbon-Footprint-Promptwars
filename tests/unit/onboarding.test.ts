import { describe, it, expect } from "vitest";
import { OnboardingDataSchema } from "@/domain/user/schemas";
import type { DietType, TransportType } from "@/domain/user/types";

describe("Onboarding Zod Validation Schema", () => {
  const validOnboardingData = {
    profile: {
      city: "San Francisco",
      country: "United States",
    },
    sustainability: {
      dietType: "vegan",
      transportType: "bicycle",
      homeType: "apartment",
    },
    goals: {
      reduceTransport: true,
      reduceFood: true,
      reduceEnergy: false,
      buildHabits: false,
      learnSustainability: false,
    },
  };

  it("passes validation for complete correct onboarding inputs", () => {
    const parseResult = OnboardingDataSchema.safeParse(validOnboardingData);
    expect(parseResult.success).toBe(true);
  });

  it("fails validation when location fields are empty", () => {
    const invalid = {
      ...validOnboardingData,
      profile: { city: "", country: "" },
    };
    const parseResult = OnboardingDataSchema.safeParse(invalid);
    expect(parseResult.success).toBe(false);
  });

  it("fails validation when invalid lifestyle selections are provided", () => {
    const invalid = {
      ...validOnboardingData,
      sustainability: {
        dietType: "junk-food" as unknown as DietType,
        transportType: "plane" as unknown as TransportType,
        homeType: "apartment",
      },
    };
    const parseResult = OnboardingDataSchema.safeParse(invalid);
    expect(parseResult.success).toBe(false);
  });

  it("fails validation when more than 3 goals are selected", () => {
    const invalid = {
      ...validOnboardingData,
      goals: {
        reduceTransport: true,
        reduceFood: true,
        reduceEnergy: true,
        buildHabits: true,
        learnSustainability: false,
      },
    };
    const parseResult = OnboardingDataSchema.safeParse(invalid);
    expect(parseResult.success).toBe(false);
  });

  it("fails validation when no goals are selected", () => {
    const invalid = {
      ...validOnboardingData,
      goals: {
        reduceTransport: false,
        reduceFood: false,
        reduceEnergy: false,
        buildHabits: false,
        learnSustainability: false,
      },
    };
    const parseResult = OnboardingDataSchema.safeParse(invalid);
    expect(parseResult.success).toBe(false);
  });

  it("passes validation when exactly 1 goal is selected", () => {
    const valid = {
      ...validOnboardingData,
      goals: {
        reduceTransport: true,
        reduceFood: false,
        reduceEnergy: false,
        buildHabits: false,
        learnSustainability: false,
      },
    };
    const parseResult = OnboardingDataSchema.safeParse(valid);
    expect(parseResult.success).toBe(true);
  });
});
