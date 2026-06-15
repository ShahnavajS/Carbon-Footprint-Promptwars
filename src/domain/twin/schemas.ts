/**
 * Twin Profile Validation Schemas
 * Using Zod for runtime validation
 */

import { z } from "zod";

// ─── Twin Strength Schema ────────────────────────────────────────────────────

export const TwinStrengthSchema = z.object({
  area: z.string().min(1).max(100),
  description: z.string().min(10).max(500),
  impact: z.string().min(10).max(300),
  score: z.number().min(0).max(100),
  evidence: z.array(z.string().min(5).max(200)).min(1).max(5),
});

// ─── Twin Weakness Schema ────────────────────────────────────────────────────

export const TwinWeaknessSchema = z.object({
  area: z.string().min(1).max(100),
  description: z.string().min(10).max(500),
  recommendation: z.string().min(10).max(300),
  potentialGain: z.number().min(0).max(1000),
  actionItems: z.array(z.string().min(5).max(200)).min(1).max(5),
});

// ─── Monthly Focus Schema ────────────────────────────────────────────────────

export const MonthlyFocusSchema = z.object({
  area: z.string().min(1).max(100),
  actionItems: z.array(z.string().min(10).max(300)).min(1).max(5),
  estimatedImpact: z.string().min(10).max(300),
  estimatedPointGain: z.number().min(0).max(500),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

// ─── Predicted Progress Schema ──────────────────────────────────────────────

export const PredictedProgressSchema = z.object({
  weeks: z.number().min(1).max(52),
  estimatedScore: z.number().min(0).max(10000),
  confidence: z.number().min(0).max(100),
  methodology: z.string().min(10).max(500),
});

// ─── Sustainability Twin Schema ─────────────────────────────────────────────

export const SustainabilityTwinSchema = z.object({
  uid: z.string().min(1).max(200),
  generatedAt: z.number().positive(),
  level: z.enum(["explorer", "citizen", "advocate", "champion"]),
  ecoScore: z.number().min(0).max(10000),

  strengths: z.array(TwinStrengthSchema).min(1).max(5),
  weaknesses: z.array(TwinWeaknessSchema).min(1).max(5),

  monthlyFocus: MonthlyFocusSchema,
  predictedProgress: z.array(PredictedProgressSchema).min(1).max(4),

  nextRegenerationAt: z.number().positive(),
  generationPromptVersion: z.string(),

  metadata: z.object({
    analyzedActivityCount: z.number().min(0),
    averageDailyPoints: z.number().min(0),
    streakDays: z.number().min(0),
  }),
});

// ─── Twin Generation Request Schema ─────────────────────────────────────────

export const TwinGenerationRequestSchema = z.object({
  userId: z.string().min(1),
  currentScore: z.number().min(0).max(10000),
  level: z.string(),
  recentActivities: z.array(
    z.object({
      category: z.string(),
      type: z.string(),
      points: z.number().min(0),
      timestamp: z.number().positive(),
    })
  ),
  preferences: z.object({
    dietType: z.string().optional(),
    transportType: z.string().optional(),
    homeType: z.string().optional(),
  }),
  streak: z.number().min(0),
  totalPoints: z.number().min(0),
});

export type SustainabilityTwin = z.infer<typeof SustainabilityTwinSchema>;
export type TwinStrength = z.infer<typeof TwinStrengthSchema>;
export type TwinWeakness = z.infer<typeof TwinWeaknessSchema>;
