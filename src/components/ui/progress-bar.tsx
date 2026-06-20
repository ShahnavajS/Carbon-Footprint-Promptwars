import * as React from "react";
import { cn } from "@/lib/utils";

type ProgressTone = "emerald" | "amber" | "blue" | "purple" | "stakes";

const FILL_CLASSES: Record<ProgressTone, string> = {
  emerald: "bg-emerald-600 dark:bg-emerald-400",
  amber: "bg-amber-500 dark:bg-amber-400",
  blue: "bg-blue-500 dark:bg-blue-400",
  purple: "bg-purple-500 dark:bg-purple-400",
  stakes: "bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500",
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
  ({ value, tone = "emerald", trackClassName, className, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, Math.round(value * 100)));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800",
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
