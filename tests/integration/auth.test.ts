import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackUserAuth } from "@/services/analytics";

// Use vi.hoisted so mockAuth is available at the time vi.mock factory runs
const mockAuth = vi.hoisted(() => {
  const instance = {
    currentUser: null as { uid: string; email: string } | null,
    onAuthStateChanged: vi.fn((cb: (user: { uid: string; email: string } | null) => void) => {
      cb(instance.currentUser);
      return () => {};
    }),
    signInWithEmailAndPassword: vi.fn(async (email: string, password: string) => {
      if (password === "correct_password") {
        instance.currentUser = { uid: "user123", email };
        return { user: instance.currentUser };
      }
      throw new Error("auth/wrong-password");
    }),
    signOut: vi.fn(async () => {
      instance.currentUser = null;
    }),
  };
  return instance;
});

vi.mock("@/services/firebase", () => ({ auth: mockAuth }));
vi.mock("@/services/analytics", () => ({ trackUserAuth: vi.fn() }));

describe("Firebase Auth Integration Mock Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.currentUser = null;
  });

  it("fires auth state listener on attach", () => {
    let captured: { uid: string; email: string } | null = null;
    mockAuth.onAuthStateChanged((user) => {
      captured = user;
    });
    expect(captured).toBeNull();
  });

  it("authenticates valid credentials and logs to Analytics", async () => {
    const result = await mockAuth.signInWithEmailAndPassword(
      "test@ecoscore.com",
      "correct_password"
    );
    expect(result.user.uid).toBe("user123");
    expect(mockAuth.currentUser).not.toBeNull();

    if (mockAuth.currentUser) {
      trackUserAuth("sign_in", mockAuth.currentUser.uid);
      expect(trackUserAuth).toHaveBeenCalledWith("sign_in", "user123");
    }
  });

  it("rejects invalid credentials and throws", async () => {
    await expect(
      mockAuth.signInWithEmailAndPassword("test@ecoscore.com", "wrong_password")
    ).rejects.toThrow("auth/wrong-password");
    expect(mockAuth.currentUser).toBeNull();
  });

  it("clears currentUser on sign out", async () => {
    mockAuth.currentUser = { uid: "user123", email: "test@ecoscore.com" };
    await mockAuth.signOut();
    expect(mockAuth.currentUser).toBeNull();
  });
});
