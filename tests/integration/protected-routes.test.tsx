import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { RouteGuard } from "@/components/auth/route-guard";
import { useAuthStore } from "@/features/auth/store";
import { usePathname } from "next/navigation";

// Mock router
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    replace: mockReplace,
  })),
  usePathname: vi.fn(),
}));

// Mock Zustand Store
vi.mock("@/features/auth/store", () => ({
  useAuthStore: vi.fn(),
}));

describe("RouteGuard Redirection Integrity Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading indicator when session status is loading", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      dbUser: null,
      isLoading: true,
    } as unknown as ReturnType<typeof useAuthStore>);
    vi.mocked(usePathname).mockReturnValue("/dashboard");

    render(
      <RouteGuard>
        <div>Dashboard Protected Content</div>
      </RouteGuard>
    );

    expect(screen.getByText("Securing session...")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard Protected Content")).toBeNull();
  });

  it("redirects unauthenticated users trying to access protected paths to /login", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      dbUser: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuthStore>);
    vi.mocked(usePathname).mockReturnValue("/dashboard");

    render(
      <RouteGuard>
        <div>Dashboard Protected Content</div>
      </RouteGuard>
    );

    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("permits unauthenticated users to access landing page and public paths", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      dbUser: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuthStore>);
    vi.mocked(usePathname).mockReturnValue("/");

    render(
      <RouteGuard>
        <div>Public Home Content</div>
      </RouteGuard>
    );

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText("Public Home Content")).toBeInTheDocument();
  });

  it("forces authenticated users to onboarding path if profile is incomplete", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { uid: "user_123" },
      dbUser: null, // No Firestore profile yet
      isLoading: false,
    } as unknown as ReturnType<typeof useAuthStore>);
    vi.mocked(usePathname).mockReturnValue("/dashboard");

    render(
      <RouteGuard>
        <div>Dashboard Content</div>
      </RouteGuard>
    );

    expect(mockReplace).toHaveBeenCalledWith("/onboarding");
  });

  it("redirects authenticated users with completed onboarding away from login/signup to dashboard", () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { uid: "user_123" },
      dbUser: {
        uid: "user_123",
        profile: { city: "Paris", country: "France", name: "Test", email: "test@test.com", avatar: null, language: "en" },
        sustainability: { dietType: "vegan", transportType: "walk", homeType: "shared" },
        goals: { reduceTransport: true, reduceFood: false, reduceEnergy: false, buildHabits: false, learnSustainability: false },
        score: { ecoScore: 450, level: 2, streak: 0 },
        metadata: { createdAt: Date.now(), updatedAt: Date.now() },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAuthStore>);
    vi.mocked(usePathname).mockReturnValue("/login");

    render(
      <RouteGuard>
        <div>Login Screen</div>
      </RouteGuard>
    );

    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });
});
