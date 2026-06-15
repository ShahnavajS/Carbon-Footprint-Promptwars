"use client";

import { useState } from "react";
import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/user.service";
import { useAuthStore } from "@/features/auth/store";
import type { OnboardingDataInput } from "@/domain/user/schemas";
import type { EcoScoreResult } from "@/domain/eco-score/types";

export function useAuthActions() {
  const { user, dbUser, isLoading: storeLoading, setError, setDbUser } = useAuthStore();
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = storeLoading || localLoading;

  const signInWithEmail = async (email: string, password: string) => {
    setLocalLoading(true);
    try {
      const cred = await AuthService.signInWithEmail(email, password);
      // Fetch Firestore profile
      const dbProfile = await UserService.getUser(cred.user.uid);
      setDbUser(dbProfile);
      return cred;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to sign in");
      throw err;
    } finally {
      setLocalLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setLocalLoading(true);
    try {
      const cred = await AuthService.signUpWithEmail(email, password);
      // Create user profile doc in firestore
      const profile = await UserService.createUserShell(cred.user.uid, email, name);
      setDbUser(profile);
      return cred;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to sign up");
      throw err;
    } finally {
      setLocalLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLocalLoading(true);
    try {
      const cred = await AuthService.signInWithGoogle();
      // Check if user has profile, otherwise create shell
      let profile = await UserService.getUser(cred.user.uid);
      if (!profile) {
        profile = await UserService.createUserShell(
          cred.user.uid,
          cred.user.email,
          cred.user.displayName
        );
      }
      setDbUser(profile);
      return cred;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to sign in with Google");
      throw err;
    } finally {
      setLocalLoading(false);
    }
  };

  const signOut = async () => {
    setLocalLoading(true);
    try {
      await AuthService.signOut();
      useAuthStore.getState().reset();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to sign out");
      throw err;
    } finally {
      setLocalLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    setLocalLoading(true);
    try {
      await AuthService.sendPasswordReset(email);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to send password reset email");
      throw err;
    } finally {
      setLocalLoading(false);
    }
  };

  const submitOnboarding = async (data: OnboardingDataInput): Promise<EcoScoreResult> => {
    if (!user) throw new Error("No user authenticated");
    setLocalLoading(true);
    try {
      const result = await UserService.submitOnboarding(user.uid, data);
      // Reload profile
      const profile = await UserService.getUser(user.uid);
      setDbUser(profile);
      return result;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to complete onboarding");
      throw err;
    } finally {
      setLocalLoading(false);
    }
  };

  return {
    user,
    dbUser,
    isLoading,
    error: useAuthStore((state) => state.error),
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    sendPasswordReset,
    submitOnboarding,
  };
}

export default useAuthActions;
