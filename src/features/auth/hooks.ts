"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/services/firebase";
import { useAuthStore } from "./store";
import { UserService } from "@/services/user.service";

/**
 * Initializes the Firebase auth listener and syncs state to Zustand.
 * Also checks for demo account session in localStorage.
 * Must be mounted once at the root layout level.
 */
export function useAuthListener() {
  const { setUser, setDbUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    // Check for demo session in localStorage
    if (typeof window !== "undefined") {
      const demoSession = localStorage.getItem("_demo_auth_user");
      if (demoSession) {
        try {
          const demoUser = JSON.parse(demoSession);
          setUser({
            uid: demoUser.uid,
            email: demoUser.email,
            displayName: demoUser.displayName || "Demo User",
            photoURL: null,
          });

          // Try to load or create demo user profile
          UserService.getUser(demoUser.uid)
            .then((dbUser) => {
              setDbUser(dbUser);
              setLoading(false);
            })
            .catch(() => {
              // For demo mode, even if Firestore fails, we have the profile in memory
              // UserService.getUser already returns demo user data from memory
              setLoading(false);
            });

          return;
        } catch {
          // Invalid demo session, continue with Firebase auth
          localStorage.removeItem("_demo_auth_user");
        }
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });

        try {
          const dbUser = await UserService.getUser(firebaseUser.uid);
          setDbUser(dbUser);
        } catch (err) {
          console.error("Failed to load user profile on auth change:", err);
          setDbUser(null);
        }
      } else {
        setUser(null);
        setDbUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setDbUser, setLoading]);
}

/**
 * Returns the current auth user, database profile, and loading state.
 */
export function useAuth() {
  return useAuthStore((state) => ({
    user: state.user,
    dbUser: state.dbUser,
    isLoading: state.isLoading,
    error: state.error,
  }));
}
