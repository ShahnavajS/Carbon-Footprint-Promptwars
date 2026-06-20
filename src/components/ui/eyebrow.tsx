import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Eyebrow — the small uppercase pill/slot above headlines, previously
 * copy-pasted verbatim into 6+ pages (page.tsx, learn, twin, community,
 * journal, impact). One component, one source of truth.
 *
 * Two tones:
 *  - "soft" (default): cream/forest tinted pill — the hero/section marker.
 *  - "band": plain mono-label text for inside dark bands.
 */
type EyebrowTone = "soft" | "band" | "clay";

const TONE_CLASSES: Record<EyebrowTone, string> = {
  soft: "bg-forest-50 text-forest-700 border-forest-150 dark:bg-forest-950/40 dark:text-forest-300 dark:border-forest-800",
  band: "bg-transparent text-forest-100/80 border-transparent tracking-[0.14em]",
  clay: "bg-clay-50 text-clay-600 border-clay-100 dark:bg-clay-950/30 dark:text-clay-300 dark:border-clay-900/40",
};

interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: EyebrowTone;
  /** Optional leading emoji/glyph. */
  icon?: React.ReactNode;
}

export function Eyebrow({ tone = "soft", icon, className, children, ...props }: EyebrowProps) {
  return (
    <span
      className={cn(
        "mono-label inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}
