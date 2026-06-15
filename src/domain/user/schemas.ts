import { z } from "zod";
import type { DietType, TransportType, HomeType } from "./types";

export const UserProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  email: z.string().email("Invalid email address").nullable(),
  avatar: z.string().url("Invalid avatar URL").nullable().optional(),
  city: z.string().min(1, "City is required").max(100, "City cannot exceed 100 characters"),
  country: z
    .string()
    .min(1, "Country is required")
    .max(100, "Country cannot exceed 100 characters"),
  language: z.string().min(1, "Language is required").default("en"),
});

export const UserPreferencesSchema = z.object({
  dietType: z.enum(
    ["vegan", "vegetarian", "mixed", "high-meat"] satisfies [DietType, ...DietType[]],
    {
      errorMap: () => ({ message: "Please select a valid diet type" }),
    }
  ),
  transportType: z.enum(
    ["walk", "bicycle", "metro", "bus", "car", "mixed"] satisfies [
      TransportType,
      ...TransportType[],
    ],
    {
      errorMap: () => ({ message: "Please select a valid transport type" }),
    }
  ),
  homeType: z.enum(["shared", "apartment", "house"] satisfies [HomeType, ...HomeType[]], {
    errorMap: () => ({ message: "Please select a valid home type" }),
  }),
});

export const UserGoalsSchema = z
  .object({
    reduceTransport: z.boolean().default(false),
    reduceFood: z.boolean().default(false),
    reduceEnergy: z.boolean().default(false),
    buildHabits: z.boolean().default(false),
    learnSustainability: z.boolean().default(false),
  })
  .refine(
    (goals) => {
      const count = Object.values(goals).filter(Boolean).length;
      return count >= 1 && count <= 3;
    },
    {
      message: "Please select between 1 and 3 goals",
      path: ["goals"],
    }
  );

export const OnboardingDataSchema = z.object({
  profile: z.object({
    city: z.string().min(1, "City is required").max(100),
    country: z.string().min(1, "Country is required").max(100),
  }),
  sustainability: UserPreferencesSchema,
  goals: UserGoalsSchema,
});

export type OnboardingDataInput = z.infer<typeof OnboardingDataSchema>;
export type UserProfileInput = z.infer<typeof UserProfileSchema>;
export type UserPreferencesInput = z.infer<typeof UserPreferencesSchema>;
export type UserGoalsInput = z.infer<typeof UserGoalsSchema>;
