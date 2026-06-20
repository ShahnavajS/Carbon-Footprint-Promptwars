import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Progress tones mapped to the forest/amber/clay/stakes palette.
 * "stakes" is the gradient used by the consequence/impact surfaces.
 */
type ProgressTone = "forest" | "amber" | "clay" | "moss" | "stakes";

const FILL_CLASSES: Record<ProgressTone, string> = {
  forest: "bg-forest-600 dark:bg-forest-400",
  amber: "bg-amber-500 dark:bg-amber-400",
  clay: "bg-clay-400 dark:bg-clay-300",
  moss: "bg-moss-400 dark:bg-moss-300",
  stakes: "bg-gradient-to-r from-forest-500 via-amber-500 to-clay-400",
};

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Progress fraction 0–1 (will be clamped). */
  value: number;
  tone?: ProgressTone;
  /** Track height in Tailwind units (default `h-1.5`). */
  trackClassName?: string;
}

/**
 * Accessible progress bar with an ARIA progressbar role and clamp-safe value.
 * Used for streak/challenge/level/goal progress throughout the app.
 */
export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, tone = "forest", trackClassName, className, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, Math.round(value * 100)));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "h-1.5 w-full overflow-hidden rounded-full bg-canvas-soft dark:bg-forest-900",
          trackClassName,
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            FILL_CLASSES[tone]
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  }
);
ProgressBar.displayName = "ProgressBar";
