import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Full-screen loading state — replaces the same hand-rolled spinner block that
 * was duplicated across dashboard, twin, community, journal, impact, onboarding,
 * and the route guard (7+ sites).
 */
interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({ message = "Loading…", className }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center bg-canvas dark:bg-forest-950",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <div
          className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-hairline border-t-forest-600 dark:border-forest-900 dark:border-t-forest-300"
          aria-hidden="true"
        />
        <p className="mono-label mt-4 text-ink-muted">{message}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
