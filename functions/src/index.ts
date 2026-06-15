import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Firebase Admin SDK once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const logger = functions.logger;

// ─── Gemini client for Cloud Functions ───────────────────────────────────────

function getGeminiClient(): GoogleGenAI {
  const apiKey =
    functions.config().gemini?.api_key ?? process.env.GEMINI_API_KEY ?? "";
  if (!apiKey) {
    throw new Error("Gemini API key not configured. Run: firebase functions:config:set gemini.api_key=YOUR_KEY");
  }
  return new GoogleGenAI({ apiKey });
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export const healthCheck = functions.https.onCall(async (_data, context) => {
  logger.info("Health check called", { uid: context.auth?.uid });
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    authenticated: !!context.auth,
  };
});

// ─── On User Created ──────────────────────────────────────────────────────────

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  logger.info(`New user created: ${user.uid}`);

  const userDocRef = db.collection("users").doc(user.uid);
  const userProfile = {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    totalCarbonSavedKg: 0,
    currentStreak: 0,
    level: 1,
    xp: 0,
  };

  try {
    await userDocRef.set(userProfile);
    logger.info(`User profile created for ${user.uid}`);
  } catch (error) {
    logger.error(`Failed to create user profile for ${user.uid}:`, error);
    throw error;
  }
});

// ─── On User Deleted ──────────────────────────────────────────────────────────

export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  logger.info(`User deleted: ${user.uid}`);

  const batch = db.batch();
  batch.delete(db.collection("users").doc(user.uid));

  try {
    await batch.commit();
    logger.info(`Cleaned up data for deleted user ${user.uid}`);
  } catch (error) {
    logger.error(`Failed to clean up data for ${user.uid}:`, error);
    throw error;
  }
});

// ─── Weekly AI Insights Generator ────────────────────────────────────────────
// Runs every Monday at 06:00 UTC. Requires Blaze plan.

export const generateWeeklyInsights = functions
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .pubsub.schedule("every monday 06:00")
  .timeZone("UTC")
  .onRun(async () => {
    logger.info("Starting weekly AI insight generation");

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const ai = getGeminiClient();

    // Fetch users who have been active in the last 7 days
    const activitiesSnap = await db
      .collection("activities")
      .where("createdAt", ">=", oneWeekAgo)
      .get();

    // Collect unique user IDs
    const userIds = [...new Set(activitiesSnap.docs.map((d) => d.data().userId as string))];
    logger.info(`Generating insights for ${userIds.length} active users`);

    for (const userId of userIds) {
      try {
        // Fetch user profile
        const userSnap = await db.collection("users").doc(userId).get();
        if (!userSnap.exists) continue;
        const user = userSnap.data()!;

        // Fetch this user's activities this week
        const userActivities = activitiesSnap.docs
          .filter((d) => d.data().userId === userId)
          .map((d) => d.data());

        const totalPoints = userActivities.reduce((s, a) => s + (a.ecoPoints as number), 0);
        const totalCarbon = userActivities.reduce((s, a) => s + (a.carbonSaved as number), 0).toFixed(2);
        const topAction = userActivities.sort((a, b) => (b.ecoPoints as number) - (a.ecoPoints as number))[0]?.actionType ?? "None";

        const prompt = `You are an expert sustainability coach. Analyze this user's eco-actions from the past 7 days.

User: ${user.profile?.name ?? "User"}
EcoScore: ${user.score?.ecoScore ?? 0}/1000
Week stats: ${userActivities.length} actions, ${totalPoints} points, ${totalCarbon}kg CO₂ saved
Top action: ${topAction}

Generate a personalized weekly sustainability insight as JSON:
{ title, summary, biggestWin, improvementArea, nextStep }`;

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                biggestWin: { type: Type.STRING },
                improvementArea: { type: Type.STRING },
                nextStep: { type: Type.STRING },
              },
              required: ["title", "summary", "biggestWin", "improvementArea", "nextStep"],
            },
          },
        });

        const parsed = JSON.parse(response.text ?? "{}");

        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);

        await db.collection("insights").add({
          userId,
          weekStart: weekStart.getTime(),
          title: parsed.title ?? "Weekly Insight",
          summary: parsed.summary ?? "",
          biggestWin: parsed.biggestWin ?? "",
          improvementArea: parsed.improvementArea ?? "",
          nextStep: parsed.nextStep ?? "",
          recommendations: [],
          generatedAt: Date.now(),
          viewed: false,
        });

        logger.info(`Insight generated for user ${userId}`);
      } catch (error) {
        logger.error(`Failed to generate insight for user ${userId}:`, error);
        // Continue with next user
      }
    }

    logger.info("Weekly insight generation complete");
  });

// ─── Weekly Recommendations Generator ────────────────────────────────────────
// Runs every Monday at 06:30 UTC.

export const generateWeeklyRecommendations = functions
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .pubsub.schedule("every monday 06:30")
  .timeZone("UTC")
  .onRun(async () => {
    logger.info("Starting weekly recommendation generation");

    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const ai = getGeminiClient();

    const activitiesSnap = await db
      .collection("activities")
      .where("createdAt", ">=", twoWeeksAgo)
      .get();

    const userIds = [...new Set(activitiesSnap.docs.map((d) => d.data().userId as string))];

    for (const userId of userIds) {
      try {
        const userSnap = await db.collection("users").doc(userId).get();
        if (!userSnap.exists) continue;
        const user = userSnap.data()!;

        const userActivities = activitiesSnap.docs
          .filter((d) => d.data().userId === userId)
          .map((d) => d.data());

        const categoryCounts = {
          food: userActivities.filter((a) => a.category === "food").length,
          transport: userActivities.filter((a) => a.category === "transport").length,
          energy: userActivities.filter((a) => a.category === "energy").length,
        };

        const prompt = `You are a sustainability coach. Generate exactly 3 personalized recommendations.

User diet: ${user.sustainability?.dietType ?? "mixed"}
Transport: ${user.sustainability?.transportType ?? "mixed"}
2-week activity: food=${categoryCounts.food}, transport=${categoryCounts.transport}, energy=${categoryCounts.energy}
EcoScore: ${user.score?.ecoScore ?? 0}

Return JSON array of 3 items: [{ action, reason, category, estimatedCarbonSaved, estimatedPoints }]`;

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  action: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  category: { type: Type.STRING },
                  estimatedCarbonSaved: { type: Type.NUMBER },
                  estimatedPoints: { type: Type.INTEGER },
                },
                required: ["action", "reason", "category", "estimatedCarbonSaved", "estimatedPoints"],
              },
            },
          },
        });

        const recs = JSON.parse(response.text ?? "[]") as Array<{
          action: string;
          reason: string;
          category: string;
          estimatedCarbonSaved: number;
          estimatedPoints: number;
        }>;

        const batch = db.batch();
        recs.slice(0, 3).forEach((rec) => {
          const ref = db.collection("recommendations").doc();
          batch.set(ref, {
            userId,
            category: rec.category,
            action: rec.action,
            reason: rec.reason,
            estimatedCarbonSaved: rec.estimatedCarbonSaved,
            estimatedPoints: rec.estimatedPoints,
            accepted: null,
            generatedAt: Date.now(),
          });
        });
        await batch.commit();
        logger.info(`3 recommendations saved for user ${userId}`);
      } catch (error) {
        logger.error(`Failed to generate recommendations for ${userId}:`, error);
      }
    }

    logger.info("Weekly recommendation generation complete");
  });

// ─── Smart Goal Adjustment (triggered on activity log) ───────────────────────

export const onActivityLoggedAdjustGoal = functions.firestore
  .document("activities/{actId}")
  .onCreate(async (snap) => {
    const activity = snap.data();
    const userId = activity.userId as string;

    if (!userId) return;

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekSnap = await db
      .collection("activities")
      .where("userId", "==", userId)
      .where("createdAt", ">=", oneWeekAgo)
      .get();

    const weekCount = weekSnap.size;
    const userSnap = await db.collection("users").doc(userId).get();
    if (!userSnap.exists) return;

    const currentDifficulty = (userSnap.data()?.score?.goalDifficulty as string) ?? "medium";
    let newDifficulty = currentDifficulty;

    if (weekCount >= 7 && currentDifficulty !== "hard") {
      newDifficulty = currentDifficulty === "easy" ? "medium" : "hard";
    } else if (weekCount < 2 && currentDifficulty !== "easy") {
      newDifficulty = currentDifficulty === "hard" ? "medium" : "easy";
    }

    if (newDifficulty !== currentDifficulty) {
      await db.collection("users").doc(userId).update({
        "score.goalDifficulty": newDifficulty,
        "metadata.updatedAt": Date.now(),
      });
      logger.info(`Goal difficulty adjusted for ${userId}: ${currentDifficulty} → ${newDifficulty}`);
    }
  });

// ─── Daily BigQuery Export ────────────────────────────────────────────────────
// Exports activity summaries to BigQuery for analytics pipeline.
// Requires BigQuery API enabled and dataset `ecoscore_analytics` created.

export const exportToBigQuery = functions
  .runWith({ timeoutSeconds: 300, memory: "256MB" })
  .pubsub.schedule("every day 00:00")
  .timeZone("UTC")
  .onRun(async () => {
    logger.info("Starting daily BigQuery export");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    try {
      const { BigQuery } = await import("@google-cloud/bigquery");
      const bigquery = new BigQuery();
      const dataset = bigquery.dataset("ecoscore_analytics");

      // Export activities
      const activitiesSnap = await db
        .collection("activities")
        .where("createdAt", ">=", yesterday.getTime())
        .where("createdAt", "<=", yesterdayEnd.getTime())
        .get();

      if (!activitiesSnap.empty) {
        const rows = activitiesSnap.docs.map((d) => ({
          activity_id: d.id,
          user_id: d.data().userId,
          category: d.data().category,
          action_type: d.data().actionType,
          eco_points: d.data().ecoPoints,
          carbon_saved: d.data().carbonSaved,
          created_at: new Date(d.data().createdAt).toISOString(),
          export_date: yesterday.toISOString().split("T")[0],
        }));

        await dataset.table("activities").insert(rows);
        logger.info(`Exported ${rows.length} activity rows to BigQuery`);
      }

      // Export recommendation acceptances
      const recsSnap = await db
        .collection("recommendations")
        .where("acceptedAt", ">=", yesterday.getTime())
        .where("acceptedAt", "<=", yesterdayEnd.getTime())
        .get();

      if (!recsSnap.empty) {
        const recRows = recsSnap.docs.map((d) => ({
          recommendation_id: d.id,
          user_id: d.data().userId,
          category: d.data().category,
          accepted: d.data().accepted,
          accepted_at: d.data().acceptedAt ? new Date(d.data().acceptedAt).toISOString() : null,
          export_date: yesterday.toISOString().split("T")[0],
        }));
        await dataset.table("recommendation_acceptances").insert(recRows);
        logger.info(`Exported ${recRows.length} recommendation rows to BigQuery`);
      }

    } catch (error) {
      logger.error("BigQuery export failed:", error);
      // Non-fatal — don't throw to avoid infinite retries
    }
  });
