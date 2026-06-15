/**
 * AI Sustainability Twin Domain
 *
 * Represents a personalized AI-generated sustainability profile that:
 * - Analyzes user strengths and weaknesses
 * - Predicts future eco-score progression
 * - Recommends monthly focus areas
 * - Powered by Gemini AI
 */

export interface TwinStrength {
  area: string;
  description: string;
  impact: string;
  score: number; // 0-100
  evidence: string[]; // User actions supporting this strength
}

export interface TwinWeakness {
  area: string;
  description: string;
  recommendation: string;
  potentialGain: number; // Estimated eco-score points available
  actionItems: string[];
}

export interface MonthlyFocus {
  area: string;
  actionItems: string[];
  estimatedImpact: string;
  estimatedPointGain: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface PredictedProgress {
  weeks: number;
  estimatedScore: number; // Projected eco-score
  confidence: number; // 0-100
  methodology: string;
}

export interface SustainabilityTwin {
  uid: string;
  generatedAt: number; // Timestamp
  level: "explorer" | "citizen" | "advocate" | "champion";
  ecoScore: number; // Current score

  // Core AI-generated insights
  strengths: TwinStrength[];
  weaknesses: TwinWeakness[];

  // Predictions and recommendations
  monthlyFocus: MonthlyFocus;
  predictedProgress: PredictedProgress[];

  // Metadata
  nextRegenerationAt: number;
  generationPromptVersion: string;
  metadata: {
    analyzedActivityCount: number;
    averageDailyPoints: number;
    streakDays: number;
  };
}

/**
 * Twin Comparison
 * Shows changes from previous generation
 */
export interface TwinComparison {
  previous: SustainabilityTwin;
  current: SustainabilityTwin;

  // Changes
  scoreChange: number;
  levelChange?: string;
  strengthsAdded: TwinStrength[];
  strengthsRemoved: TwinStrength[];
  focusChange: string;

  summary: string;
}

/**
 * Twin Generation Request
 * Internal type for service communication
 */
export interface TwinGenerationData {
  userId: string;
  currentScore: number;
  level: string;
  recentActivities: Array<{
    category: string;
    type: string;
    points: number;
    timestamp: number;
  }>;
  preferences: {
    dietType: string;
    transportType: string;
    homeType: string;
  };
  streak: number;
  totalPoints: number;
}
