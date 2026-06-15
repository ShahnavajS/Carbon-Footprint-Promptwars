/**
 * Friend Circles Domain Types
 * Represents social circles for group engagement and collaboration
 */

export type CircleRole = "owner" | "admin" | "member";
export type CircleVisibility = "private" | "friends_only" | "public";

export interface Circle {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: CircleMember[];
  visibility: CircleVisibility;
  createdAt: number;
  updatedAt: number;
  stats: CircleStats;
}

export interface CircleMember {
  userId: string;
  role: CircleRole;
  joinedAt: number;
  lastActivity: number;
  contribution: number; // EcoPoints contributed to circle
}

export interface CircleStats {
  totalMembers: number;
  totalEcoScore: number;
  averageEcoScore: number;
  weeklyProgress: number;
  activeMembers: number; // Members active in last 7 days
}

export interface CircleWeeklyRanking {
  circleId: string;
  week: number; // ISO week number
  year: number;
  rankings: CircleMemberRanking[];
  topAchievements: string[];
  generatedAt: number;
}

export interface CircleMemberRanking {
  userId: string;
  rank: number;
  ecoScore: number;
  activities: number;
  change: number; // Rank change from previous week
}

export interface CircleInvite {
  id: string;
  circleId: string;
  invitedBy: string;
  invitedEmail: string;
  invitedAt: number;
  expiresAt: number;
  status: "pending" | "accepted" | "declined" | "expired";
}
