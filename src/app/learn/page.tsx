import Link from "next/link";
import type { Metadata } from "next";
import { Leaf, ArrowRight, Clock } from "lucide-react";
import {
  LEARN_ARTICLES,
  LEARN_CATEGORY_LABELS,
  getArticlesByCategory,
} from "@/content/learn/registry";
import type { LearnCategory } from "@/content/learn/schema";

export const metadata: Metadata = {
  title: "Learn — EcoScore",
  description:
    "Understand climate change and your carbon footprint. Clear, fact-checked explainers on CO₂, 1.5°C, where emissions come from, and what you can do.",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  intro: "Beginner",
  intermediate: "Intermediate",
  "deep-dive": "Deep dive",
};

/**
 * Learn hub index — the awareness gateway.
 *
 * Static server component (no client JS) listing all curated articles grouped
 * by category. This is the page that turns EcoScore from a tracker into an
 * awareness platform.
 */
export default function LearnPage() {
  const categories = Object.keys(LEARN_CATEGORY_LABELS) as LearnCategory[];

  return (
    <div className="min-h-screen bg-canvas text-ink dark:bg-forest-950 dark:text-forest-50">
      <header className="border-b border-hairline/60 bg-white/60 backdrop-blur-md dark:border-forest-800/60 dark:bg-forest-900/60">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-forest-200/60 bg-forest-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-forest-700 dark:border-forest-900/30 dark:bg-forest-950/30 dark:text-forest-300">
            <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
            Awareness Hub
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink dark:text-paper sm:text-4xl">
            Understand your impact. Then change it.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft dark:text-forest-200/70">
            Clear, fact-checked explainers on the climate — no jargon, no guilt. Every article
            connects the science to the choices you make every day.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {categories.map((category) => {
          const articles = getArticlesByCategory(category);
          if (articles.length === 0) return null;
          return (
            <section key={category} className="mb-12">
              <h2 className="mb-4 text-lg font-bold text-ink dark:text-paper">
                {LEARN_CATEGORY_LABELS[category]}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/learn/${article.slug}`}
                    className="group flex flex-col rounded-2xl border border-hairline/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-forest-800 dark:bg-forest-900"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-3xl" aria-hidden="true">
                        {article.emoji}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-canvas-soft px-2 py-0.5 text-[10px] font-bold text-ink-muted dark:bg-forest-900 dark:text-ink-muted">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {article.readingMinutes} min
                      </span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug text-ink group-hover:text-forest-600 dark:text-paper dark:group-hover:text-emerald-400">
                      {article.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-muted dark:text-forest-200/60">
                      {article.summary}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[10px] font-bold text-forest-700 dark:bg-forest-950/40 dark:text-forest-300">
                        {DIFFICULTY_LABEL[article.difficulty]}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 text-ink-muted transition-colors group-hover:text-forest-600 dark:text-ink-soft"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* Footer nudge */}
        <div className="rounded-2xl border border-forest-100 bg-forest-50/40 p-6 text-center dark:border-forest-900/30 dark:bg-forest-950/10">
          <p className="text-sm font-semibold text-forest-800 dark:text-forest-300">
            {LEARN_ARTICLES.length} articles and growing
          </p>
          <p className="mt-1 text-xs text-ink-muted dark:text-forest-200/60">
            Knowledge is the first leaf of change. Pick one article, and let it shape your next
            green choice.
          </p>
        </div>
      </main>
    </div>
  );
}
