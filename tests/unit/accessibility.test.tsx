import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeEnabled();
    expect((await axe(container)).violations).toEqual([]);
  });
});
