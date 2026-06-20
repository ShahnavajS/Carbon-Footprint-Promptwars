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
 * Cohere-style big-number metric tile: mono label, oversized Fraunces value,
 * flat surface, no icon-in-circle. Depth comes from the headline number, not
 * decoration. Used across the dashboard, twin, and impact surfaces.
 */
export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, unit, icon: Icon, iconClassName, caption, trend, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-hairline bg-paper p-6 dark:border-forest-800 dark:bg-forest-900",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="mono-label text-ink-muted dark:text-forest-200/60">{label}</span>
        {Icon ? (
          <Icon
            aria-hidden="true"
            className={cn("h-4 w-4 text-forest-500 dark:text-forest-300", iconClassName)}
          />
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-5xl font-medium tracking-tight text-ink dark:text-paper">
          {value}
        </span>
        {unit ? (
          <span className="mono-label text-ink-muted dark:text-forest-200/50">{unit}</span>
        ) : null}
      </div>
      {(trend || caption) && (
        <div className="mt-3 space-y-1.5">
          {trend}
          {caption ? (
            <p className="text-xs text-ink-soft dark:text-forest-200/70">{caption}</p>
          ) : null}
        </div>
      )}
    </div>
  )
);
StatCard.displayName = "StatCard";
