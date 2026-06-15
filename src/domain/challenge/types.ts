/**
 * Community Challenges Domain Types
 * Represents global and group challenges for engagement
 */

export type ChallengeType = "food" | "transport" | "energy" | "general";

export type ChallengeDifficulty = "easy" | "medium" | "hard";
export type ChallengeStatus = "draft" | "active" | "ended" | "archived";

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  status: ChallengeStatus;
  goal: string; // e.g., "Log 5 vegetarian meals"
  icon: string; // SVG or emoji
  color: string; // Tailwind color
  startDate: number;
  endDate: number;
  participants: number;
  createdAt: number;
  createdBy: string; // Admin user ID
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  joinedAt: number;
  progress: number; // 0-100
  completedAt?: number;
  entries: ChallengeEntry[];
  rank?: number;
}

export interface ChallengeEntry {
  id: string;
  challengeId: string;
  userId: string;
  activityId: string;
  loggedAt: number;
  value: number; // Activity value towards challenge
}

export interface ChallengeLeaderboard {
  challengeId: string;
  rankings: ChallengeRanking[];
  generatedAt: number;
}

export interface ChallengeRanking {
  rank: number;
  userId: string;
  userName: string;
  progress: number;
  entries: number;
}

export interface ChallengeBadge {
  challengeId: string;
  userId: string;
  completed: boolean;
  rank: "gold" | "silver" | "bronze" | null;
  earnedAt?: number;
}

export interface UserChallengeStats {
  userId: string;
  totalParticipated: number;
  totalCompleted: number;
  completionRate: number;
  currentStreak: number;
}
