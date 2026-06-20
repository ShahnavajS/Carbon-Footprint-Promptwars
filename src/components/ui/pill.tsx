import * as React from "react";
import { cn } from "@/lib/utils";

type PillTone = "neutral" | "emerald" | "amber" | "blue" | "purple" | "slate";

const TONE_CLASSES: Record<PillTone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  slate: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
}

/**
 * Small rounded status chip (e.g. "Level 3", "+12 this week", category tags).
 */
export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  ({ tone = "emerald", className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  )
);
Pill.displayName = "Pill";
