import { z } from "zod";

// ─── Gemini Response Validation Schemas ───────────────────────────────────────

/**
 * Validates the raw JSON returned by Gemini for weekly insight generation.
 * Strict bounds prevent hallucinated or malformed strings entering Firestore.
 */
export const GeminiInsightSchema = z.object({
  title: z.string().min(5).max(120),
  summary: z.string().min(10).max(400),
  biggestWin: z.string().min(5).max(250),
  improvementArea: z.string().min(5).max(250),
  nextStep: z.string().min(5).max(250),
});

export type GeminiInsightPayload = z.infer<typeof GeminiInsightSchema>;

/**
 * Validates each item in the Gemini recommendations JSON array.
 */
export const GeminiRecommendationItemSchema = z.object({
  action: z.string().min(5).max(200),
  reason: z.string().min(5).max(300),
  category: z.enum(["food", "transport", "energy"]),
  estimatedCarbonSaved: z.number().min(0).max(50),
  estimatedPoints: z.number().int().min(0).max(100),
});

export const GeminiRecommendationsSchema = z.array(GeminiRecommendationItemSchema).min(1).max(5);

export type GeminiRecommendationItem = z.infer<typeof GeminiRecommendationItemSchema>;
