import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label shown above the value (e.g. "EcoScore Vitality"). */
  label: string;
  /** Primary metric, rendered large. */
  value: React.ReactNode;
  /** Optional unit suffix (e.g. "days", "/ 1000"). */
  unit?: string;
  /** Leading icon. */
  icon?: LucideIcon;
  /** Tailwind text-color class for the icon (defaults to emerald). */
  iconClassName?: string;
  /** Optional caption rendered under the value (e.g. streak/last action). */
  caption?: React.ReactNode;
  /** Optional trend/change chip rendered inline. */
  trend?: React.ReactNode;
}

/**
 * Compact metric card used across the dashboard and report surfaces.
 * Keeps a single, consistent treatment for headline numbers + icon + caption.
 */
export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, unit, icon: Icon, iconClassName, caption, trend, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {Icon ? (
          <Icon
            aria-hidden="true"
            className={cn("h-5 w-5 text-emerald-600 dark:text-emerald-400", iconClassName)}
          />
        ) : null}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          {value}
        </span>
        {unit ? <span className="text-xs font-bold text-slate-400">{unit}</span> : null}
      </div>
      {(trend || caption) && (
        <div className="mt-3 space-y-1">
          {trend}
          {caption ? <p className="text-xs text-slate-500 dark:text-slate-400">{caption}</p> : null}
        </div>
      )}
    </div>
  )
);
StatCard.displayName = "StatCard";
