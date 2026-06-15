// ─── AI Insight Domain Types ──────────────────────────────────────────────────

export interface AiRecommendation {
  id: string;
  userId: string;
  category: "food" | "transport" | "energy";
  action: string;
  reason: string;
  estimatedCarbonSaved: number; // kg CO₂
  estimatedPoints: number;
  accepted: boolean | null; // null = pending, true = accepted, false = dismissed
  acceptedAt?: number;
  generatedAt: number;
}

export interface AiInsight {
  id: string;
  userId: string;
  weekStart: number; // timestamp of Monday 00:00 of the insight week
  title: string;
  summary: string;
  biggestWin: string;
  improvementArea: string;
  nextStep: string;
  recommendations: AiRecommendation[];
  generatedAt: number;
  viewed: boolean;
}

/** Raw Gemini output shape (before enriching with userId, timestamps, etc.) */
export interface GeminiInsightPayload {
  title: string;
  summary: string;
  biggestWin: string;
  improvementArea: string;
  nextStep: string;
}

/** Raw Gemini recommendation item (before enriching) */
export interface GeminiRecommendationItem {
  action: string;
  reason: string;
  category: "food" | "transport" | "energy";
  estimatedCarbonSaved: number;
  estimatedPoints: number;
}
