import { AuthRepository } from "@/repositories/auth.repository";
import { trackEvent } from "./analytics";
import { UserCredential } from "firebase/auth";

export const AuthService = {
  async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    const cred = await AuthRepository.signInWithEmail(email, password);
    if (cred.user) {
      trackEvent("signin_completed", {
        userId: cred.user.uid,
        method: "email",
      });
    }
    return cred;
  },

  async signUpWithEmail(email: string, password: string): Promise<UserCredential> {
    trackEvent("signup_started", { method: "email" });
    const cred = await AuthRepository.signUpWithEmail(email, password);
    if (cred.user) {
      trackEvent("signup_completed", {
        userId: cred.user.uid,
        method: "email",
      });
    }
    return cred;
  },

  async signInWithGoogle(): Promise<UserCredential> {
    trackEvent("signup_started", { method: "google" });
    const cred = await AuthRepository.signInWithGoogle();
    if (cred.user) {
      // Since Google Auth handles both signup and login seamlessly, we can log both or trace check
      // We log signup_completed for telemetry simplicity or check if it's their first time
      trackEvent("signup_completed", {
        userId: cred.user.uid,
        method: "google",
      });
      trackEvent("signin_completed", {
        userId: cred.user.uid,
        method: "google",
      });
    }
    return cred;
  },

  async signOut(): Promise<void> {
    return AuthRepository.signOut();
  },

  async sendPasswordReset(email: string): Promise<void> {
    return AuthRepository.sendPasswordReset(email);
  },

  getCurrentUser() {
    return AuthRepository.getCurrentUser();
  },
};

export default AuthService;
