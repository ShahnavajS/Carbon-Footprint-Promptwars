/**
 * Monthly Report Card Domain Types
 * Represents user's monthly sustainability summary
 */

export interface MonthlyStats {
  totalActivities: number;
  totalEcoPoints: number;
  totalCarbonSaved: number;
  bestCategory: "food" | "transport" | "energy" | null;
  bestCategoryCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: number;
}

export interface MonthlyReportCard {
  id: string;
  userId: string;
  year: number;
  month: number; // 1-12
  ecoScore: number;
  ecoScoreChange: number; // delta from last month
  carbonSaved: number;
  carbonSavedChange: number;
  currentStreak: number;
  bestStreak: number;
  bestHabit: string | null; // Most logged action type
  bestCategory: "food" | "transport" | "energy" | null;
  achievements: Achievement[];
  communityRanking: number | null; // Position in city/region ranking
  generatedAt: number;
  viewedAt?: number;
  sharedAt?: number;
}

export interface ReportCardMetadata {
  userId: string;
  year: number;
  month: number;
  generatedAt: number;
  isShared: boolean;
  shareCount: number;
}
