"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { Spinner } from "@/components/ui/loading";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/"];
const AUTH_RESTRICTED_PATHS = ["/login", "/signup", "/forgot-password"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, dbUser, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const hasCompletedOnboarding =
      dbUser &&
      dbUser.score &&
      dbUser.score.ecoScore > 0 &&
      dbUser.profile.city !== "" &&
      dbUser.profile.country !== "";

    // 1. Not Authenticated
    if (!user) {
      const isPublicPath = PUBLIC_PATHS.includes(pathname);
      if (!isPublicPath) {
        router.replace("/login");
      }
      return;
    }

    // 2. Authenticated
    if (user) {
      // Landing page is always accessible
      if (pathname === "/") {
        return;
      }

      if (hasCompletedOnboarding) {
        // Already completed onboarding -> prevent visiting signup/forgot-password
        if (AUTH_RESTRICTED_PATHS.includes(pathname) || pathname === "/onboarding") {
          router.replace("/dashboard");
        }
      } else {
        // Authenticated but hasn't completed onboarding -> force onboarding unless on login or onboarding
        if (pathname !== "/onboarding" && pathname !== "/login") {
          router.replace("/onboarding");
        }
      }
    }
  }, [user, dbUser, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center">
          <Spinner className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            Securing session...
          </p>
        </div>
      </div>
    );
  }

  // Render children once auth routing settles
  return <>{children}</>;
}

export default RouteGuard;
