import { create } from "zustand";
import type { EcoScoreUser } from "@/domain/user/types";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: AuthUser | null;
  dbUser: EcoScoreUser | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: AuthUser | null) => void;
  setDbUser: (dbUser: EcoScoreUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  dbUser: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user, isLoading: false, error: null }),
  setDbUser: (dbUser) => set({ dbUser, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: () => set({ user: null, dbUser: null, isLoading: false, error: null }),
}));

export default useAuthStore;
