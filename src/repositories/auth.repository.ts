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

// Demo account bypass flag
const DEMO_EMAIL = "test@ecoscore.com";
const DEMO_PASSWORD = "password123";
const DEMO_UID = "test-eco-user-id";

export interface IAuthRepository {
  signInWithEmail(email: string, password: string): Promise<UserCredential>;
  signUpWithEmail(email: string, password: string): Promise<UserCredential>;
  signInWithGoogle(): Promise<UserCredential>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  getCurrentUser(): FirebaseUser | null;
}

// Create a mock UserCredential for demo account bypass
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getIdTokenResult: async () => ({ token: "demo-token" }) as any,
      reload: async () => {},
      toJSON: () => ({}),
    } as FirebaseUser,
    providerId: null,
  } as UserCredential;
}

export const AuthRepository: IAuthRepository = {
  async signInWithEmail(email, password): Promise<UserCredential> {
    // Demo account bypass - allow login without Firebase Emulator
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      // Store demo session in localStorage for auth listener to pick up
      const mockUser = createMockUserCredential(email, DEMO_UID);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "_demo_auth_user",
          JSON.stringify({
            uid: mockUser.user.uid,
            email: mockUser.user.email,
            displayName: mockUser.user.displayName,
          })
        );
      }
      return mockUser;
    }

    return signInWithEmailAndPassword(auth, email, password);
  },

  async signUpWithEmail(email, password): Promise<UserCredential> {
    return createUserWithEmailAndPassword(auth, email, password);
  },

  async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    // Configure custom parameters for Google Auth if needed
    provider.setCustomParameters({ prompt: "select_account" });
    return signInWithPopup(auth, provider);
  },

  async signOut(): Promise<void> {
    // Clear demo session if exists
    if (typeof window !== "undefined") {
      localStorage.removeItem("_demo_auth_user");
    }
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
    // Check for demo session first
    if (typeof window !== "undefined") {
      const demoSession = localStorage.getItem("_demo_auth_user");
      if (demoSession) {
        try {
          const demoUser = JSON.parse(demoSession);
          return createMockUserCredential(demoUser.email, demoUser.uid).user;
        } catch {
          // Invalid demo session, fall through to Firebase
        }
      }
    }
    return auth.currentUser;
  },
};

export default AuthRepository;
