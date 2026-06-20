import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential,
} from "firebase/auth";
import { auth } from "@/services/firebase";
import { DEMO_UID } from "@/config/constants";
import { startDemoSession, readDemoSession, clearDemoSession } from "@/lib/demo-session";

// Demo credentials allow a Firebase-free login for the public demo. They are
// intentionally not secret — the demo session is fully client-side.
const DEMO_EMAIL = "test@ecoscore.com";
const DEMO_PASSWORD = "password123";

export interface IAuthRepository {
  signInWithEmail(email: string, password: string): Promise<UserCredential>;
  signUpWithEmail(email: string, password: string): Promise<UserCredential>;
  signInWithGoogle(): Promise<UserCredential>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  getCurrentUser(): FirebaseUser | null;
}

/**
 * Builds an in-memory mock UserCredential for the demo account so the rest of
 * the app (which expects a Firebase User) works unchanged in demo mode.
 */
function createMockUserCredential(email: string, uid: string): UserCredential {
  return {
    user: {
      uid,
      email,
      displayName: "Demo User",
      photoURL: null,
      emailVerified: true,
      isAnonymous: false,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
      providerData: [],
      phoneNumber: null,
      tenantId: null,
      refreshToken: "demo-refresh-token",
      providerId: "custom",
      delete: async () => {},
      getIdToken: async () => "demo-token",
      getIdTokenResult: async () =>
        Promise.resolve({
          token: "demo-token",
          signInProvider: "custom",
          signInSecondFactor: null,
          authTime: new Date().toISOString(),
          issuedAtTime: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 3600_000).toISOString(),
          claims: {},
        }),
      reload: async () => {},
      toJSON: () => ({}),
      // FirebaseUser has many optional/internal members; cast through unknown
      // for the demo mock only (never used against real Firebase).
    } as unknown as FirebaseUser,
    providerId: null,
  } as unknown as UserCredential;
}

export const AuthRepository: IAuthRepository = {
  async signInWithEmail(email, password): Promise<UserCredential> {
    // Demo account bypass — allow login without Firebase Emulator.
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const mockUser = createMockUserCredential(email, DEMO_UID);
      startDemoSession({
        uid: mockUser.user.uid,
        email: mockUser.user.email ?? "",
        displayName: mockUser.user.displayName ?? "Demo User",
      });
      return mockUser;
    }

    return signInWithEmailAndPassword(auth, email, password);
  },

  async signUpWithEmail(email, password): Promise<UserCredential> {
    return createUserWithEmailAndPassword(auth, email, password);
  },

  async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return signInWithPopup(auth, provider);
  },

  async signOut(): Promise<void> {
    clearDemoSession();
    return firebaseSignOut(auth);
  },

  async sendPasswordReset(email): Promise<void> {
    const actionCodeSettings = {
      url:
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : "http://localhost:3000/login",
      handleCodeInApp: true,
    };
    return sendPasswordResetEmail(auth, email, actionCodeSettings);
  },

  getCurrentUser(): FirebaseUser | null {
    const demoSession = readDemoSession();
    if (demoSession) {
      return createMockUserCredential(demoSession.email, demoSession.uid).user;
    }
    return auth.currentUser;
  },
};

export default AuthRepository;
