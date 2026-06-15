/**
 * Referral Service
 * Business logic for referral programs and growth tracking
 */

import { Firestore } from "firebase/firestore";
import { ReferralRepository } from "@/repositories/referral.repository";
import { ReferralCode, UserReferralProfile } from "@/domain/referral/types";

export class ReferralService {
  private referralRepo: ReferralRepository;

  constructor(db: Firestore) {
    this.referralRepo = new ReferralRepository(db);
  }

  /**
   * Generate unique referral code for user
   */
  async generateReferralCode(userId: string): Promise<ReferralCode> {
    try {
      // Check if user already has code
      const existing = await this.referralRepo.getUserCode(userId);
      if (existing) {
        return existing;
      }

      // Generate unique code
      const code = this.generateUniqueCode(userId);
      return await this.referralRepo.createCode(userId, code);
    } catch (error) {
      throw new Error(`Failed to generate referral code: ${error}`);
    }
  }

  /**
   * Get user's referral code
   */
  async getUserCode(userId: string): Promise<ReferralCode | null> {
    try {
      return await this.referralRepo.getUserCode(userId);
    } catch (error) {
      throw new Error(`Failed to get user code: ${error}`);
    }
  }

  /**
   * Send referral invite
   */
  async sendInvite(referrerId: string, invitedEmail: string): Promise<string> {
    try {
      const code = await this.generateReferralCode(referrerId);
      const invite = await this.referralRepo.sendInvite(code.id, referrerId, invitedEmail);
      return invite.id;
    } catch (error) {
      throw new Error(`Failed to send invite: ${error}`);
    }
  }

  /**
   * Process signup from referral
   */
  async processReferralSignup(referralCode: string, newUserId: string): Promise<number> {
    try {
      const code = await this.referralRepo.getCodeByString(referralCode);
      if (!code) {
        throw new Error("Invalid referral code");
      }

      // Award immediate bonus for referrer
      const immediateBonus = 250; // EcoPoints

      await this.referralRepo.createReward(
        code.userId,
        newUserId,
        immediateBonus,
        "invite_accepted"
      );

      // Update new user's profile
      await this.referralRepo.updateProfile(newUserId, {
        referredBy: code.userId,
        referredByCode: referralCode,
        joinedViaReferral: true,
      });

      return immediateBonus;
    } catch (error) {
      throw new Error(`Failed to process referral signup: ${error}`);
    }
  }

  /**
   * Get user's referral profile
   */
  async getUserProfile(userId: string): Promise<UserReferralProfile> {
    try {
      return await this.referralRepo.getOrCreateProfile(userId);
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error}`);
    }
  }

  /**
   * Get pending rewards for user
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getPendingRewards(userId: string): Promise<{ total: number; rewards: any[] }> {
    try {
      const rewards = await this.referralRepo.getUserRewards(userId);
      const pending = rewards.filter((r) => !r.claimed);

      return {
        total: pending.reduce((sum, r) => sum + r.ecoPointsAwarded, 0),
        rewards: pending,
      };
    } catch (error) {
      throw new Error(`Failed to get pending rewards: ${error}`);
    }
  }

  /**
   * Claim rewards
   */
  async claimRewards(userId: string): Promise<number> {
    try {
      const rewards = await this.referralRepo.getUserRewards(userId);
      const pending = rewards.filter((r) => !r.claimed);

      let totalClaimed = 0;

      for (const reward of pending) {
        await this.referralRepo.claimReward(reward.id);
        totalClaimed += reward.ecoPointsAwarded;
      }

      return totalClaimed;
    } catch (error) {
      throw new Error(`Failed to claim rewards: ${error}`);
    }
  }

  /**
   * Award milestone bonuses
   */
  async checkMilebonuses(newUserId: string, referrerId: string): Promise<number> {
    try {
      let bonus = 0;

      // Check first week active
      // Would need to check if user has activities in first 7 days
      bonus += 100;
      await this.referralRepo.createReward(referrerId, newUserId, 100, "first_week_active");

      // Check first month active
      // Would need to check if user has activities in first 30 days
      bonus += 250;
      await this.referralRepo.createReward(referrerId, newUserId, 250, "first_month_active");

      return bonus;
    } catch (error) {
      throw new Error(`Failed to check milestones: ${error}`);
    }
  }

  /**
   * Generate unique code
   */
  private generateUniqueCode(userId: string): string {
    const timestamp = Date.now().toString(36);
    const userHash = userId.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();

    return `ECO-${userHash}-${random}-${timestamp}`.substring(0, 20);
  }

  /**
   * Validate referral code format
   */
  validateCode(code: string): boolean {
    return code.startsWith("ECO-") && code.length >= 15;
  }

  /**
   * Get referral stats for user
   */
  async getReferralStats(userId: string): Promise<{
    totalInvites: number;
    successfulSignups: number;
    totalEarnings: number;
    pendingEarnings: number;
    conversionRate: number;
  }> {
    try {
      const code = await this.referralRepo.getUserCode(userId);
      const rewards = await this.referralRepo.getUserRewards(userId);
      const pending = rewards.filter((r) => !r.claimed);

      const totalEarnings = rewards.reduce((sum, r) => sum + r.ecoPointsAwarded, 0);
      const pendingEarnings = pending.reduce((sum, r) => sum + r.ecoPointsAwarded, 0);

      return {
        totalInvites: code?.stats.invitesSent || 0,
        successfulSignups: code?.stats.signupsGenerated || 0,
        totalEarnings,
        pendingEarnings,
        conversionRate:
          code && code.stats.invitesSent > 0
            ? (code.stats.signupsGenerated / code.stats.invitesSent) * 100
            : 0,
      };
    } catch (error) {
      throw new Error(`Failed to get referral stats: ${error}`);
    }
  }
}
