import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";
import { env } from "@/config/env";

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const isBrowser = typeof window !== "undefined";

export const auth: Auth = isBrowser ? getAuth(app) : (null as unknown as Auth);
export const db: Firestore = getFirestore(app);
export const functions: Functions = isBrowser ? getFunctions(app) : (null as unknown as Functions);

// Disable emulator connections for mock mode - we use localStorage instead
// No Firebase emulator setup needed

// Analytics runs client-side only and might not be supported in some testing/headless setups
export let analytics: Analytics | null = null;

if (isBrowser) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
export { app };
export default app;
