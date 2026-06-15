/**
 * Cloud Functions for Phase 5
 * Scheduled and triggered functions for background processing
 */

import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// ============================================================
// SCHEDULED: Generate Monthly Reports (Monthly at month end)
// ============================================================
export const generateMonthlyReports = functions.pubsub
  .schedule("0 0 1 * *") // Run at midnight on the 1st of each month
  .timeZone("UTC")
  .onRun(async () => {
    try {
      const now = new Date();
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const year = previousMonth.getFullYear();
      const month = previousMonth.getMonth() + 1;

      // Get all users
      const usersSnap = await db.collection("users").get();
      let generated = 0;
      let failed = 0;

      for (const userDoc of usersSnap.docs) {
        try {
          const userId = userDoc.id;
          const userData = userDoc.data();

          // Get activities for the previous month
          const monthStart = new Date(year, month - 1, 1).getTime();
          const monthEnd = new Date(year, month, 0, 23, 59, 59).getTime();

          const activitiesSnap = await db
            .collection(`users/${userId}/activities`)
            .where("loggedAt", ">=", monthStart)
            .where("loggedAt", "<=", monthEnd)
            .get();

          // Calculate stats
          const activities = activitiesSnap.docs.map((doc) => doc.data());
          const totalCarbonSaved = activities.reduce((sum: number, a: any) => sum + (a.carbonSaved || 0), 0);

          // Determine best category
          const categoryStats: Record<string, number> = {};
          activities.forEach((a: any) => {
            categoryStats[a.category] = (categoryStats[a.category] || 0) + 1;
          });

          const bestCategory =
            Object.entries(categoryStats).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] ||
            null;

          // Get current eco score
          const currentEcoScore = userData.ecoScore || 0;

          // Create report
          const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });
          
          await db.collection("monthly_report_cards").add({
            userId,
            year,
            month,
            ecoScore: currentEcoScore,
            ecoScoreChange: 0,
            carbonSaved: Math.round(totalCarbonSaved * 10) / 10,
            carbonSavedChange: 0,
            currentStreak: userData.currentStreak || 0,
            bestStreak: userData.bestStreak || 0,
            bestHabit: null,
            bestCategory,
            achievements: [],
            communityRanking: null,
            generatedAt: Timestamp.now(),
            shareCount: 0,
          });

          // Send notification
          const fcmTokens = await db
            .collection("fcm_tokens")
            .where("userId", "==", userId)
            .where("isActive", "==", true)
            .get();

          if (fcmTokens.docs.length > 0) {
            await db.collection("notification_queue").add({
              userId,
              type: "report_ready",
              payload: {
                title: `📊 Your ${monthName} report is ready!`,
                body: `Check out your monthly EcoScore report and see how much you've saved.`,
                data: { month: month.toString(), year: year.toString() },
              },
              status: "pending",
              attempts: 0,
            });
          }

          generated++;
        } catch (error) {
          console.error(`Failed to generate report for user:`, error);
          failed++;
        }
      }

      console.log(`Generated ${generated} reports, ${failed} failed`);
      return { generated, failed };
    } catch (error) {
      console.error("Failed to generate monthly reports:", error);
      throw error;
    }
  });

// ============================================================
// SCHEDULED: Calculate Leaderboards (Weekly on Monday)
// ============================================================
export const calculateLeaderboards = functions.pubsub
  .schedule("0 0 * * 1") // Run at midnight on Monday UTC
  .timeZone("UTC")
  .onRun(async () => {
    try {
      // Get all users with their eco scores
      const usersSnap = await db.collection("users").get();

      const rankings = usersSnap.docs
        .map((doc, idx) => {
          const data = doc.data();
          return {
            rank: idx + 1,
            userId: doc.id,
            userName: data.displayName || "User",
            avatarUrl: data.photoURL,
            metric: data.ecoScore || 0,
            change: 0, // Would compare to previous week
            trend: "neutral" as const,
            badges: [], // Would get from user_badges
            lastActivityAt: data.lastActivityAt || Date.now(),
          };
        })
        .sort((a, b) => b.metric - a.metric)
        .map((r, idx) => ({ ...r, rank: idx + 1 }));

      // Create global leaderboard
      await db.collection("leaderboards").add({
        scope: "global",
        metric: "eco_score",
        period: "weekly",
        rankings,
        generatedAt: Timestamp.now(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      console.log(`Created leaderboard with ${rankings.length} users`);
      return { created: true, count: rankings.length };
    } catch (error) {
      console.error("Failed to calculate leaderboards:", error);
      throw error;
    }
  });

// ============================================================
// TRIGGERED: Award Badges (Triggered by activity)
// ============================================================
export const checkBadgesOnActivity = functions.firestore
  .document("users/{userId}/activities/{activityId}")
  .onCreate(async (snap: any, context: any) => {
    try {
      const { userId } = context.params;
      const activity = snap.data();

      // Get user's current stats
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) return;

      const userData = userDoc.data()!;
      const currentStreak = userData.currentStreak || 0;

      // Check for eco_beginner badge
      const hasEcoBeginner = await db
        .collection("user_badges")
        .where("userId", "==", userId)
        .where("badgeId", "==", "eco_beginner")
        .get();

      if (hasEcoBeginner.empty) {
        // Award eco_beginner badge
        await db.collection("user_badges").add({
          userId,
          badgeId: "eco_beginner",
          unlockedAt: Timestamp.now(),
          progress: 100,
          isNew: true,
          notificationSent: false,
        });

        // Send notification
        await db.collection("notification_queue").add({
          userId,
          type: "badge_unlocked",
          payload: {
            title: "🎉 Achievement Unlocked!",
            body: 'You\'ve earned the "Eco Beginner" badge!',
            data: { badgeIcon: "🌱", badgeName: "Eco Beginner" },
          },
          status: "pending",
          attempts: 0,
        });
      }

      // Check streak badges
      const streakBadges = [
        { badgeId: "streak_7", target: 7 },
        { badgeId: "streak_30", target: 30 },
        { badgeId: "streak_100", target: 100 },
      ];

      for (const { badgeId, target } of streakBadges) {
        if (currentStreak >= target) {
          const hasBadge = await db
            .collection("user_badges")
            .where("userId", "==", userId)
            .where("badgeId", "==", badgeId)
            .get();

          if (hasBadge.empty) {
            await db.collection("user_badges").add({
              userId,
              badgeId,
              unlockedAt: Timestamp.now(),
              progress: 100,
              isNew: true,
              notificationSent: false,
            });
          }
        }
      }

      return { processed: true };
    } catch (error) {
      console.error("Failed to check badges:", error);
      throw error;
    }
  });

// ============================================================
// HTTP: Process Referral Signup
// ============================================================
export const processReferralSignup = functions.https.onCall(async (data: any, context: any) => {
  try {
    const { referralCode, newUserId } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    if (!referralCode || !newUserId) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required parameters");
    }

    // Find referral code
    const codesSnap = await db
      .collection("referral_codes")
      .where("code", "==", referralCode)
      .get();

    if (codesSnap.empty) {
      throw new functions.https.HttpsError("not-found", "Invalid referral code");
    }

    const codeDoc = codesSnap.docs[0];
    const code = codeDoc.data();

    // Award bonus to referrer
    const referrerId = code.userId;
    await db.collection("referral_rewards").add({
      referrerId,
      referralId: newUserId,
      ecoPointsAwarded: 250,
      reason: "invite_accepted",
      awardedAt: Timestamp.now(),
      claimed: false,
    });

    // Update new user's profile
    await db.collection("user_referral_profiles").add({
      userId: newUserId,
      referredBy: referrerId,
      referredByCode: referralCode,
      joinedViaReferral: true,
      totalEarnings: 0,
      pendingRewards: 250,
      claimedRewards: 0,
      updatedAt: Timestamp.now(),
    });

    return { success: true, bonusAwarded: 250 };
  } catch (error) {
    console.error("Failed to process referral signup:", error);
    throw error;
  }
});

// ============================================================
// SCHEDULED: Send Pending Notifications (Every hour)
// ============================================================
export const sendPendingNotifications = functions.pubsub
  .schedule("0 * * * *") // Every hour
  .timeZone("UTC")
  .onRun(async () => {
    try {
      // Get pending notifications (limit 100)
      const pendingSnap = await db
        .collection("notification_queue")
        .where("status", "==", "pending")
        .limit(100)
        .get();

      let sent = 0;
      let failed = 0;

      for (const doc of pendingSnap.docs) {
        try {
          const notification = doc.data();

          // In real implementation, would use admin SDK messaging
          // For now, just mark as sent
          await doc.ref.update({
            status: "sent",
            sentAt: Timestamp.now(),
          });

          sent++;
        } catch (error) {
          console.error(`Failed to send notification ${doc.id}:`, error);
          failed++;
        }
      }

      console.log(`Sent ${sent} notifications, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      console.error("Failed to send pending notifications:", error);
      throw error;
    }
  });

// ============================================================
// SCHEDULED: Clean Up Expired Leaderboards (Weekly)
// ============================================================
export const cleanupExpiredLeaderboards = functions.pubsub
  .schedule("0 1 * * 0") // Every Sunday at 1 AM
  .timeZone("UTC")
  .onRun(async () => {
    try {
      const now = new Date();
      const expiredSnap = await db
        .collection("leaderboards")
        .where("expiresAt", "<", now)
        .get();

      let deleted = 0;

      for (const doc of expiredSnap.docs) {
        await doc.ref.update({ deletedAt: Timestamp.now() });
        deleted++;
      }

      console.log(`Cleaned up ${deleted} expired leaderboards`);
      return { deleted };
    } catch (error) {
      console.error("Failed to cleanup expired leaderboards:", error);
      throw error;
    }
  });
