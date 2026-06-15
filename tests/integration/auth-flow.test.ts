import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "@/services/auth.service";
import { AuthRepository } from "@/repositories/auth.repository";
import { trackEvent } from "@/services/analytics";

vi.mock("@/repositories/auth.repository", () => ({
  AuthRepository: {
    signInWithEmail: vi.fn().mockResolvedValue({ user: { uid: "user_login_123" } }),
    signUpWithEmail: vi.fn().mockResolvedValue({ user: { uid: "user_signup_123" } }),
    signInWithGoogle: vi.fn().mockResolvedValue({ user: { uid: "google_user_123" } }),
  },
}));

vi.mock("@/services/analytics", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("@/services/user.service", () => ({
  UserService: {
    createUserShell: vi.fn().mockResolvedValue({
      uid: "user_signup_123",
      profile: { name: "Test User", email: "test@ecoscore.com" },
    }),
  },
}));

describe("Authentication Services Integration Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles email sign-in successfully and logs analytical events", async () => {
    const cred = await AuthService.signInWithEmail("test@ecoscore.com", "password123");
    
    expect(AuthRepository.signInWithEmail).toHaveBeenCalledWith("test@ecoscore.com", "password123");
    expect(cred.user.uid).toBe("user_login_123");
    expect(trackEvent).toHaveBeenCalledWith("signin_completed", {
      userId: "user_login_123",
      method: "email",
    });
  });

  it("handles email registration and fires signup tracking", async () => {
    const cred = await AuthService.signUpWithEmail("new@ecoscore.com", "password123");

    expect(AuthRepository.signUpWithEmail).toHaveBeenCalledWith("new@ecoscore.com", "password123");
    expect(cred.user.uid).toBe("user_signup_123");
    expect(trackEvent).toHaveBeenCalledWith("signup_started", { method: "email" });
    expect(trackEvent).toHaveBeenCalledWith("signup_completed", {
      userId: "user_signup_123",
      method: "email",
    });
  });

  it("handles Google sign-in and tracks Google login/registration", async () => {
    const cred = await AuthService.signInWithGoogle();

    expect(AuthRepository.signInWithGoogle).toHaveBeenCalled();
    expect(cred.user.uid).toBe("google_user_123");
    expect(trackEvent).toHaveBeenCalledWith("signup_started", { method: "google" });
    expect(trackEvent).toHaveBeenCalledWith("signup_completed", {
      userId: "google_user_123",
      method: "google",
    });
  });
});
