import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SectionLabel — a plain (un-pilled) mono uppercase marker used above list
 * sections, table columns, and dark-band headings. Cohere uses these as quiet
 * category tags; here it complements the pill-shaped `Eyebrow` for surfaces
 * where a bordered chip is too loud.
 */
interface SectionLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Muted treatment (default) vs. on-dark variant. */
  onDark?: boolean;
}

export function SectionLabel({ onDark = false, className, children, ...props }: SectionLabelProps) {
  return (
    <span
      className={cn("mono-label", onDark ? "text-forest-100/70" : "text-ink-muted", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export default SectionLabel;
