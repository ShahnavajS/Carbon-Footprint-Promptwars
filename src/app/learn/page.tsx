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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200/60 bg-white/60 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400">
            <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
            Awareness Hub
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Understand your impact. Then change it.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
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
              <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">
                {LEARN_CATEGORY_LABELS[category]}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/learn/${article.slug}`}
                    className="group flex flex-col rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-3xl" aria-hidden="true">
                        {article.emoji}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {article.readingMinutes} min
                      </span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug text-slate-950 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                      {article.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {article.summary}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {DIFFICULTY_LABEL[article.difficulty]}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 text-slate-300 transition-colors group-hover:text-emerald-600 dark:text-slate-600"
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
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 text-center dark:border-emerald-900/30 dark:bg-emerald-950/10">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
            {LEARN_ARTICLES.length} articles and growing
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Knowledge is the first leaf of change. Pick one article, and let it shape your next
            green choice.
          </p>
        </div>
      </main>
    </div>
  );
}
