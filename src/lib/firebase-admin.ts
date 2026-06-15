import * as admin from "firebase-admin";

const isServer = typeof window === "undefined";

function initAdminSDK() {
  if (!isServer) return null;

  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const nodeEnv = process.env.NODE_ENV;
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "ecoscore-mock";
  const isMock = projectId.includes("mock") || !!process.env.FIRESTORE_EMULATOR_HOST;

  if (nodeEnv === "test" || isMock) {
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
    }
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
    }
    return admin.initializeApp({ projectId });
  }

  try {
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY ?? "";
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    return admin.apps.length > 0 ? admin.apps[0] : null;
  }
}

const adminApp = initAdminSDK();

export const adminAuth = adminApp ? admin.auth() : null;
export const adminDb = adminApp ? admin.firestore() : null;

export { adminApp };
export default adminApp;
