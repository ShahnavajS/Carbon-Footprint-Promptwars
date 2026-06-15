/**
 * Leaderboards Domain Types
 * Represents competitive rankings across different scopes
 */

export type LeaderboardScope = "global" | "city" | "country" | "friends" | "circle";
export type LeaderboardMetric = "eco_score" | "streak" | "challenges" | "carbon_saved";

export interface Leaderboard {
  id: string;
  scope: LeaderboardScope;
  location?: {
    city?: string;
    country?: string;
    region?: string;
  };
  metric: LeaderboardMetric;
  period: "weekly" | "monthly" | "alltime";
  rankings: LeaderboardEntry[];
  generatedAt: number;
  expiresAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatarUrl?: string;
  metric: number;
  change: number; // Rank change from previous period (-1, 0, +1, etc)
  trend: "up" | "down" | "neutral";
  badges: string[]; // Badge IDs
  lastActivityAt: number;
}

export interface UserLeaderboardPosition {
  userId: string;
  positions: {
    [key in LeaderboardScope]?: {
      [key in LeaderboardMetric]?: {
        rank: number;
        value: number;
        percentile: number; // 0-100
      };
    };
  };
  updatedAt: number;
}

export interface LeaderboardStats {
  totalParticipants: number;
  topPercentile: number; // User's percentile (0-100)
  averageMetric: number;
  userRank: number;
  userValue: number;
}

export interface LeaderboardNotification {
  id: string;
  userId: string;
  type: "rank_up" | "rank_down" | "new_top_10" | "lost_top_10";
  leaderboardScope: LeaderboardScope;
  metric: LeaderboardMetric;
  previousRank: number;
  currentRank: number;
  createdAt: number;
}
