import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  /** Card/section title. */
  title: React.ReactNode;
  /** Optional leading icon. */
  icon?: LucideIcon;
  /** Tailwind text-color class for the icon. */
  iconClassName?: string;
  /** Optional small label rendered above the title (eyebrow). */
  eyebrow?: string;
  /** Optional trailing action (e.g. a "View all" link). */
  action?: React.ReactNode;
  /** Optional description below the title. */
  description?: React.ReactNode;
  className?: string;
}

/**
 * Consistent header for dashboard sections: eyebrow + title + icon + trailing
 * action. Replaces ad-hoc per-card header markup across the dashboard.
 */
export function SectionHeader({
  title,
  icon: Icon,
  iconClassName,
  eyebrow,
  action,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon ? (
            <Icon
              aria-hidden="true"
              className={cn("h-5 w-5 text-emerald-600 dark:text-emerald-400", iconClassName)}
            />
          ) : null}
          {eyebrow ? (
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {eyebrow}
            </span>
          ) : null}
        </div>
        {action}
      </div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold leading-tight text-slate-950 dark:text-white">
          {title}
        </h3>
      </div>
      {description ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
    </div>
  );
}
