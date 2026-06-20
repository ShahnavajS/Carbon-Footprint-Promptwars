import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CelebrationOverlay } from "@/components/ui/celebration-overlay";
import { EcoCompanion } from "@/components/mascot/eco-companion";
import { Trophy } from "lucide-react";
import SignupPage from "@/app/signup/page";
import { RouteGuard } from "@/components/auth/route-guard";

const authActions = vi.hoisted(() => ({
  signUpWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  isLoading: false,
  error: null as string | null,
}));

const authStoreState = vi.hoisted(() => ({
  user: null,
  dbUser: null,
  isLoading: false,
}));

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  pathname: "/",
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuthActions: vi.fn(() => authActions),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/auth/store", () => ({
  useAuthStore: vi.fn(() => authStoreState),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: navigation.push,
    replace: navigation.replace,
  })),
  usePathname: vi.fn(() => navigation.pathname),
}));

describe("accessibility checks with jest-axe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authActions.isLoading = false;
    authActions.error = null;
    authStoreState.user = null;
    authStoreState.dbUser = null;
    authStoreState.isLoading = false;
    navigation.pathname = "/";
  });

  it("Button loading state remains accessible and disabled", async () => {
    const { container } = render(<Button isLoading>Save changes</Button>);

    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect((await axe(container)).violations).toEqual([]);
  });

  it("Input wires label, error, aria-invalid, and describedby correctly", async () => {
    const { container } = render(
      <Input id="email" label="Email Address" error="Email is required" />
    );

    const input = screen.getByLabelText("Email Address");
    const error = screen.getByRole("alert");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "email-error");
    expect(error).toHaveAttribute("id", "email-error");
    expect((await axe(container)).violations).toEqual([]);
  });

  it("RouteGuard loading state has no detectable accessibility violations", async () => {
    authStoreState.isLoading = true;
    navigation.pathname = "/dashboard";

    const { container } = render(
      <RouteGuard>
        <main>Dashboard</main>
      </RouteGuard>
    );

    expect(screen.getByText("Securing session...")).toBeInTheDocument();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("Signup form exposes accessible names and no initial axe violations", async () => {
    const { container } = render(<SignupPage />);

    expect(screen.getByRole("heading", { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeEnabled();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("StatCard renders an accessible label and value with no axe violations", async () => {
    const { container } = render(
      <StatCard label="EcoScore Vitality" icon={Trophy} value={580} unit="/ 1000" />
    );
    expect(screen.getByText("EcoScore Vitality")).toBeInTheDocument();
    expect(screen.getByText("580")).toBeInTheDocument();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("Pill renders as static text (not a focusable element) with no axe violations", async () => {
    const { container } = render(<Pill tone="forest">Level 3</Pill>);
    expect(screen.getByText("Level 3")).toBeInTheDocument();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("ProgressBar exposes an ARIA progressbar role and clamped value", async () => {
    const { container } = render(<ProgressBar value={0.6} aria-label="Monthly goal" />);
    const bar = screen.getByRole("progressbar", { name: "Monthly goal" });
    expect(bar).toHaveAttribute("aria-valuenow", "60");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect((await axe(container)).violations).toEqual([]);
  });

  it("CelebrationOverlay is a labelled, dismissible dialog when open", async () => {
    const { container } = render(
      <CelebrationOverlay
        open
        onClose={() => {}}
        title="Milestone unlocked!"
        message="You saved your first 10 kg of CO₂."
      />
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { name: /milestone unlocked/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close celebration/i })).toBeInTheDocument();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("EcoCompanion exposes its mood line to assistive tech via aria-live", async () => {
    const { container } = render(
      <EcoCompanion streak={0} lastActivityAt={null} />
    );
    // The mood line is announced politely.
    expect(container.querySelector('[aria-live="polite"]')).toBeTruthy();
    // The decorative SVG must be hidden from AT.
    const svg = container.querySelector("svg");
    expect(
      svg?.getAttribute("aria-hidden") === "true" || svg?.getAttribute("role") === "presentation"
    ).toBe(true);
    expect((await axe(container)).violations).toEqual([]);
  });
});
