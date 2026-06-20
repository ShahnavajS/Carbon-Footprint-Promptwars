"use client";

import * as React from "react";
import { getMascotMood, type MascotMoodResult } from "@/lib/mascot-engine";
import { cn } from "@/lib/utils";

/**
 * EcoCompanion — the emotional anchor of the app.
 *
 * A small "Gaia seedling" character that reacts to the user's progress. It is
 * rendered as inline SVG by default (so it works with zero asset dependencies
 * and respects color/dark-mode), but accepts a `characterSrc` image to swap in
 * hand-drawn mascot art (idle/happy/proud/sad) when provided.
 *
 * Accessibility: the mood line is exposed to screen readers via aria-live, the
 * decorative SVG is aria-hidden, and all motion respects prefers-reduced-motion
 * (handled globally in globals.css).
 */

interface EcoCompanionProps {
  streak: number;
  bestStreak?: number;
  lastActivityAt: number | null;
  ecoScore?: number;
  /** Optional image override (e.g. a hand-drawn mascot state). */
  characterSrc?: string;
  /** Compact variant for inline use (smaller, no speech bubble). */
  compact?: boolean;
  className?: string;
}

export function EcoCompanion({
  streak,
  bestStreak,
  lastActivityAt,
  ecoScore,
  characterSrc,
  compact = false,
  className,
}: EcoCompanionProps) {
  const [mood] = React.useState<MascotMoodResult>(() =>
    getMascotMood({ streak, bestStreak, lastActivityAt, ecoScore })
  );

  const a11yLabel = `Your companion is feeling ${mood.mood}. ${mood.line}`;

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        compact ? "flex-row" : "flex-col sm:flex-row",
        className
      )}
    >
      {/* Character */}
      <div className="relative shrink-0" aria-hidden="true">
        {characterSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={characterSrc}
            alt=""
            className={cn("rounded-full object-cover", compact ? "h-10 w-10" : "h-16 w-16")}
          />
        ) : (
          <SeedlingMascot size={compact ? 40 : 64} mood={mood.mood} animated={mood.animated} />
        )}
      </div>

      {/* Speech bubble / line */}
      <div className={cn(compact ? "" : "sm:max-w-xs")}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Gaia · {mood.emoji} {mood.mood}
        </p>
        <p
          aria-live="polite"
          className="mt-0.5 text-sm font-medium italic leading-snug text-slate-700 dark:text-slate-300"
        >
          {mood.line}
        </p>
      </div>

      <span className="sr-only">{a11yLabel}</span>
    </div>
  );
}

/**
 * Inline SVG seedling mascot. A simple, friendly face on a leaf/sprout body.
 * The expression and color shift with the mood so it reads emotionally even
 * without the text.
 */
function SeedlingMascot({
  size,
  mood,
  animated,
}: {
  size: number;
  mood: MascotMoodResult["mood"];
  animated: boolean;
}) {
  // Mood → leaf fill color.
  const leafFill =
    mood === "wistful"
      ? "#fbbf24" // amber — dormant but warm
      : mood === "celebrating"
        ? "#34d399" // bright emerald
        : "#10b981"; // emerald
  const cheekOpacity = mood === "wistful" ? 0 : 0.5;
  // Mouth path varies: smile for positive moods, gentle line for wistful.
  const mouth = mood === "wistful" ? "M21 33 Q26 30 31 33" : "M21 32 Q26 37 31 32";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? "animate-eco-float" : undefined}
      role="presentation"
    >
      {/* Pot / body */}
      <path d="M14 36 L17 46 Q17 48 19 48 L33 48 Q35 48 35 46 L38 36 Z" fill="#a8855a" />
      <ellipse cx="26" cy="36" rx="12" ry="2.5" fill="#8b6741" />
      {/* Stem */}
      <path d="M26 36 L26 22" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
      {/* Left leaf */}
      <path d="M26 24 Q14 18 12 24 Q14 30 26 26 Z" fill={leafFill} opacity="0.92" />
      {/* Right leaf */}
      <path d="M26 24 Q38 18 40 24 Q38 30 26 26 Z" fill={leafFill} />
      {/* Face on the right leaf */}
      <circle cx="33" cy="23" r="1.4" fill="#06300f" />
      <circle cx="37" cy="23" r="1.4" fill="#06300f" />
      <path d={mouth} stroke="#06300f" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* Cheeks (hidden when wistful) */}
      <circle cx="32" cy="26" r="1.1" fill="#fb7185" opacity={cheekOpacity} />
      <circle cx="38" cy="26" r="1.1" fill="#fb7185" opacity={cheekOpacity} />
      {/* Sparkle when celebrating */}
      {mood === "celebrating" && (
        <>
          <circle cx="10" cy="12" r="1" fill="#fcd34d" />
          <circle cx="44" cy="10" r="1.2" fill="#fcd34d" />
          <circle cx="42" cy="16" r="0.8" fill="#fcd34d" />
        </>
      )}
    </svg>
  );
}

export default EcoCompanion;
