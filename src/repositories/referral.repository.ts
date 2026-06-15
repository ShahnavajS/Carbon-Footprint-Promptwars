/**
 * Referral System Repository
 * Data access layer for referral codes and tracking
 */

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Firestore,
} from "firebase/firestore";
import {
  ReferralCode,
  ReferralInvite,
  ReferralReward,
  UserReferralProfile,
} from "@/domain/referral/types";
import type {
  ReferralCodeDoc,
  ReferralInviteDoc,
  ReferralRewardDoc,
  UserReferralProfileDoc,
} from "@/domain/firestore.schema";

export class ReferralRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Create referral code for user
   */
  async createCode(userId: string, code: string): Promise<ReferralCode> {
    try {
      const docRef = await addDoc(collection(this.db, "referral_codes"), {
        userId,
        code,
        createdAt: Date.now(),
        isActive: true,
        stats: {
          invitesSent: 0,
          signupsGenerated: 0,
          ecoPointsEarned: 0,
          bestMonthEarnings: 0,
        },
      } as ReferralCodeDoc);

      return {
        id: docRef.id,
        userId,
        code,
        createdAt: Date.now(),
        isActive: true,
        stats: {
          invitesSent: 0,
          signupsGenerated: 0,
          ecoPointsEarned: 0,
          bestMonthEarnings: 0,
        },
      };
    } catch (error) {
      throw new Error(`Failed to create referral code: ${error}`);
    }
  }

  /**
   * Get referral code by code string
   */
  async getCodeByString(code: string): Promise<ReferralCode | null> {
    try {
      const snapshot = await getDocs(
        query(collection(this.db, "referral_codes"), where("code", "==", code))
      );

      if (snapshot.empty) return null;

      const data = snapshot.docs[0].data() as ReferralCodeDoc;
      return {
        id: snapshot.docs[0].id,
        ...data,
      };
    } catch (error) {
      throw new Error(`Failed to get referral code: ${error}`);
    }
  }

  /**
   * Get referral code for user
   */
  async getUserCode(userId: string): Promise<ReferralCode | null> {
    try {
      const snapshot = await getDocs(
        query(collection(this.db, "referral_codes"), where("userId", "==", userId))
      );

      if (snapshot.empty) return null;

      const data = snapshot.docs[0].data() as ReferralCodeDoc;
      return {
        id: snapshot.docs[0].id,
        ...data,
      };
    } catch (error) {
      throw new Error(`Failed to get user code: ${error}`);
    }
  }

  /**
   * Send referral invite
   */
  async sendInvite(
    referralCodeId: string,
    referrerId: string,
    invitedEmail: string
  ): Promise<ReferralInvite> {
    try {
      const docRef = await addDoc(collection(this.db, `referral_codes/${referralCodeId}/invites`), {
        referralCodeId,
        referrerId,
        invitedEmail,
        invitedAt: Date.now(),
        status: "pending",
      } as ReferralInviteDoc);

      // Update code stats
      const codeRef = doc(this.db, "referral_codes", referralCodeId);
      const code = await this.getCodeByString(referralCodeId);
      if (code) {
        await updateDoc(codeRef, {
          "stats.invitesSent": code.stats.invitesSent + 1,
        });
      }

      return {
        id: docRef.id,
        referralCodeId,
        referrerId,
        invitedEmail,
        invitedAt: Date.now(),
        status: "pending",
      };
    } catch (error) {
      throw new Error(`Failed to send invite: ${error}`);
    }
  }

  /**
   * Mark invite as signed up
   */
  async markInviteAsSignedUp(
    inviteId: string,
    newUserId: string,
    referralCodeId: string
  ): Promise<void> {
    try {
      const inviteRef = doc(this.db, `referral_codes/${referralCodeId}/invites`, inviteId);
      await updateDoc(inviteRef, {
        status: "signed_up",
        signedUpAt: Date.now(),
        newUserId,
      });

      // Update code stats
      const codeRef = doc(this.db, "referral_codes", referralCodeId);
      const code = await this.getCodeByString(referralCodeId);
      if (code) {
        await updateDoc(codeRef, {
          "stats.signupsGenerated": code.stats.signupsGenerated + 1,
        });
      }
    } catch (error) {
      throw new Error(`Failed to mark invite as signed up: ${error}`);
    }
  }

  /**
   * Create referral reward
   */
  async createReward(
    referrerId: string,
    referralId: string,
    ecoPoints: number,
    reason: "invite_accepted" | "first_week_active" | "first_month_active"
  ): Promise<ReferralReward> {
    try {
      const docRef = await addDoc(collection(this.db, "referral_rewards"), {
        referrerId,
        referralId,
        ecoPointsAwarded: ecoPoints,
        reason,
        awardedAt: Date.now(),
        claimed: false,
      } as ReferralRewardDoc);

      return {
        id: docRef.id,
        referrerId,
        referralId,
        ecoPointsAwarded: ecoPoints,
        reason,
        awardedAt: Date.now(),
        claimed: false,
      };
    } catch (error) {
      throw new Error(`Failed to create reward: ${error}`);
    }
  }

  /**
   * Get rewards for user
   */
  async getUserRewards(userId: string): Promise<ReferralReward[]> {
    try {
      const snapshot = await getDocs(
        query(collection(this.db, "referral_rewards"), where("referrerId", "==", userId))
      );

      return snapshot.docs.map((doc) => {
        const data = doc.data() as ReferralRewardDoc;
        return {
          id: doc.id,
          ...data,
        };
      });
    } catch (error) {
      throw new Error(`Failed to get user rewards: ${error}`);
    }
  }

  /**
   * Claim reward
   */
  async claimReward(rewardId: string): Promise<void> {
    try {
      const docRef = doc(this.db, "referral_rewards", rewardId);
      await updateDoc(docRef, {
        claimed: true,
        claimedAt: Date.now(),
      });
    } catch (error) {
      throw new Error(`Failed to claim reward: ${error}`);
    }
  }

  /**
   * Get or create user referral profile
   */
  async getOrCreateProfile(userId: string): Promise<UserReferralProfile> {
    try {
      const snapshot = await getDocs(
        query(collection(this.db, "user_referral_profiles"), where("userId", "==", userId))
      );

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as UserReferralProfileDoc;
        return {
          userId: data.userId,
          totalEarnings: data.totalEarnings,
          pendingRewards: data.pendingRewards,
          claimedRewards: data.claimedRewards,
          referredBy: data.referredBy,
          referredByCode: data.referredByCode,
          joinedViaReferral: data.joinedViaReferral,
        };
      }

      // Create new profile
      await addDoc(collection(this.db, "user_referral_profiles"), {
        userId,
        totalEarnings: 0,
        pendingRewards: 0,
        claimedRewards: 0,
        joinedViaReferral: false,
        updatedAt: Date.now(),
      } as UserReferralProfileDoc);

      return {
        userId,
        totalEarnings: 0,
        pendingRewards: 0,
        claimedRewards: 0,
        joinedViaReferral: false,
      };
    } catch (error) {
      throw new Error(`Failed to get or create profile: ${error}`);
    }
  }

  /**
   * Update user referral profile
   */
  async updateProfile(userId: string, updates: Partial<UserReferralProfile>): Promise<void> {
    try {
      const snapshot = await getDocs(
        query(collection(this.db, "user_referral_profiles"), where("userId", "==", userId))
      );

      if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, {
          ...updates,
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      throw new Error(`Failed to update profile: ${error}`);
    }
  }
}
