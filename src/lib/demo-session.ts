/**
 * Client-side demo-session helpers.
 *
 * The public demo runs entirely in the browser: this writes a sentinel auth
 * object to localStorage so the auth listener (`useAuthListener`) hydrates the
 * Zustand store without any Firebase call, and every API route short-circuits
 * to seeded fixture data when it sees the demo uid.
 */

import { DEMO_AUTH_STORAGE_KEY, DEMO_UID } from "@/config/constants";

export interface DemoAuthUser {
  uid: string;
  email: string;
  displayName: string;
}

const DEMO_USER: DemoAuthUser = {
  uid: DEMO_UID,
  email: "demo@ecoscore.app",
  displayName: "Aarav Sharma",
};

/** Persists the demo session to localStorage. Safe to call only in the browser. */
export function startDemoSession(user: DemoAuthUser = DEMO_USER): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(user));
}

/** Reads the persisted demo session, or null if none. */
export function readDemoSession(): DemoAuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoAuthUser;
  } catch {
    return null;
  }
}

/** Clears the demo session. */
export function clearDemoSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
}
