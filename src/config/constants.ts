/**
 * Shared, environment-independent constants.
 *
 * Kept separate from {@link env} (which validates and can throw on bad
 * configuration) so these are always safe to import from any context.
 */

/**
 * Sentinel user id for the public, client-side demo mode.
 *
 * Demo mode lets the entire app run without a Firebase project or Gemini key:
 * the client writes `_demo_auth_user` to localStorage with this uid, and every
 * API route / service short-circuits to seeded fixture data when it sees it.
 */
export const DEMO_UID = "test-eco-user-id";

/** localStorage key under which the demo auth session is persisted. */
export const DEMO_AUTH_STORAGE_KEY = "_demo_auth_user";

/** Returns true when the given id is the demo sentinel user. */
export function isDemoUid(userId: string | undefined | null): boolean {
  return userId === DEMO_UID;
}
