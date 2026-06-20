import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Pill tones mapped to the forest/cream/clay palette. "forest" is the default
 * brand tone; "clay"/"amber" carry warm accents sparingly.
 */
type PillTone = "neutral" | "forest" | "moss" | "amber" | "clay" | "blue";

const TONE_CLASSES: Record<PillTone, string> = {
  neutral: "bg-canvas-soft text-ink-soft dark:bg-forest-900 dark:text-forest-200/80",
  forest: "bg-forest-50 text-forest-700 dark:bg-forest-950/50 dark:text-forest-300",
  moss: "bg-moss-50 text-moss-500 dark:bg-moss-500/15 dark:text-moss-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  clay: "bg-clay-50 text-clay-600 dark:bg-clay-950/30 dark:text-clay-300",
  blue: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
};

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
}

/**
 * Small rounded status chip (e.g. "Level 3", "+12 this week", category tags).
 */
export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  ({ tone = "forest", className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-bold",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  )
);
Pill.displayName = "Pill";
