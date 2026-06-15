/**
 * Referral System Domain Types
 * Represents user referrals and growth tracking
 */

export interface ReferralCode {
  id: string;
  userId: string;
  code: string; // Unique referral code
  createdAt: number;
  expiresAt?: number;
  isActive: boolean;
  stats: ReferralStats;
}

export interface ReferralStats {
  invitesSent: number;
  signupsGenerated: number;
  ecoPointsEarned: number;
  bestMonthEarnings: number;
}

export interface ReferralInvite {
  id: string;
  referralCodeId: string;
  referrerId: string;
  invitedEmail: string;
  invitedAt: number;
  status: "pending" | "signed_up" | "declined" | "expired";
  signedUpAt?: number;
  newUserId?: string;
}

export interface ReferralReward {
  id: string;
  referrerId: string;
  referralId: string;
  ecoPointsAwarded: number;
  reason: "invite_accepted" | "first_week_active" | "first_month_active";
  awardedAt: number;
  claimed: boolean;
  claimedAt?: number;
}

export interface ReferralLeaderboard {
  rank: number;
  userId: string;
  referralCode: string;
  signupsGenerated: number;
  ecoPointsEarned: number;
  period: "weekly" | "monthly" | "alltime";
}

export interface UserReferralProfile {
  userId: string;
  referralCode?: ReferralCode;
  totalEarnings: number;
  pendingRewards: number;
  claimedRewards: number;
  referredBy?: string; // User who referred this user
  referredByCode?: string;
  joinedViaReferral: boolean;
}
