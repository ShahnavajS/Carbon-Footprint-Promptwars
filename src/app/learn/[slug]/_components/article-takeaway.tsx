"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useAuthActions } from "@/hooks/use-auth";
import { isDemoUid } from "@/config/constants";

/**
 * Hybrid AI takeaway block for a Learn article.
 *
 * Fetches a short, personalized "why this matters for YOU" line from
 * /api/learn/takeaway. Falls back gracefully: while loading it shows a neutral
 * shimmer; on any failure the API itself returns a curated fallback so the user
 * always sees something useful.
 */
export function ArticleTakeaway({ slug }: { slug: string }) {
  const { user, dbUser } = useAuthActions();
  const [takeaway, setTakeaway] = React.useState<string | null>(null);
  const [personalized, setPersonalized] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const userId = user?.uid ?? (dbUser && isDemoUid(dbUser.uid) ? dbUser.uid : undefined);
        // Derive the user's weakest category from their score breakdown if present.
        const focusCategory = weakestCategory(dbUser?.score);
        const res = await fetch("/api/learn/takeaway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            userId,
            ecoScore: dbUser?.score?.ecoScore,
            focusCategory,
          }),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setTakeaway(json.takeaway);
        setPersonalized(Boolean(json.personalized));
      } catch {
        // Non-fatal: the block simply stays hidden.
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, user?.uid, dbUser]);

  if (!takeaway) {
    // Subtle skeleton — never a blank gap.
    return (
      <div
        className="mt-8 animate-pulse rounded-2xl border border-forest-100 bg-forest-50/20 p-5 dark:border-forest-900/30 dark:bg-forest-950/5"
        aria-hidden="true"
      >
        <div className="h-3 w-24 rounded bg-emerald-200/40 dark:bg-emerald-900/30" />
        <div className="mt-3 h-4 w-full rounded bg-emerald-200/30 dark:bg-emerald-900/20" />
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-forest-100 bg-gradient-to-br from-forest-50/60 to-teal-50/40 p-5 dark:border-forest-900/30 dark:from-forest-950/20 dark:to-teal-950/10">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-forest-600 dark:text-forest-300">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Why this matters for you
        {!personalized && (
          <span className="ml-1 rounded-full bg-hairline/60 px-1.5 py-0.5 text-[8px] text-ink-muted dark:bg-forest-800/60 dark:text-ink-muted">
            general
          </span>
        )}
      </span>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft dark:text-forest-200/80">
        {takeaway}
      </p>
    </div>
  );
}

/** Picks the category with the lowest activity count, if known. */
function weakestCategory(
  score?: { ecoScore?: number; streak?: number } | null
): "food" | "transport" | "energy" | undefined {
  // Without per-category telemetry wired in yet, we don't infer a focus.
  // This stays here so future activity breakdowns can personalize the takeaway.
  void score;
  return undefined;
}
