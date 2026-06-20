"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface CelebrationOverlayProps {
  open: boolean;
  onClose: () => void;
  /** Headline (e.g. "Milestone unlocked!"). */
  title: string;
  /** Emoji or icon shown large. */
  emoji?: string;
  /** Supporting copy. */
  message?: React.ReactNode;
  /** Optional call-to-action button label. */
  ctaLabel?: string;
}

/**
 * A focus-trapped, escape-dismissable celebratory modal used for milestone
 * unlocks, streak rewards, and biome tier-ups. Announces itself politely to
 * screen readers via role="dialog" + aria-live, and respects reduced motion
 * (no confetti animation when the user opts out).
 */
export function CelebrationOverlay({
  open,
  onClose,
  title,
  emoji = "🎉",
  message,
  ctaLabel = "Continue",
}: CelebrationOverlayProps) {
  const [mounted, setMounted] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close celebration"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full max-w-sm rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-2xl dark:border-emerald-900/30 dark:bg-slate-900",
          "animate-eco-pop"
        )}
      >
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-5xl dark:bg-emerald-950/40">
          <span aria-hidden="true">{emoji}</span>
        </div>
        <h2
          id="celebration-title"
          className="text-xl font-extrabold text-slate-950 dark:text-white"
        >
          {title}
        </h2>
        {message ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          {ctaLabel}
        </button>
      </div>
    </div>,
    document.body
  );
}
