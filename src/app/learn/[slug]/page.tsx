import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Clock, BookOpen, ExternalLink, Sparkles } from "lucide-react";
import { LEARN_ARTICLES, getArticle } from "@/content/learn/registry";
import { ArticleTakeaway } from "./_components/article-takeaway";

/** Pre-render every article at build time. */
export function generateStaticParams() {
  return LEARN_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article not found — EcoScore" };
  return {
    title: `${article.title} — EcoScore Learn`,
    description: article.summary,
  };
}

/** Tiny markdown-lite renderer: paragraphs + **bold**. Keeps content safe (no raw HTML). */
function renderBody(body: string) {
  return body.split(/\n\n+/).map((para, i) => (
    <p key={i} className="mb-4 text-sm leading-relaxed text-ink-soft dark:text-forest-200/80">
      {para.split(/(\*\*[^*]+\*\*)/).map((chunk, j) =>
        chunk.startsWith("**") && chunk.endsWith("**") ? (
          <strong key={j} className="font-bold text-ink dark:text-paper">
            {chunk.slice(2, -2)}
          </strong>
        ) : (
          <span key={j}>{chunk}</span>
        )
      )}
    </p>
  ));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <div className="min-h-screen bg-canvas text-ink dark:bg-forest-950 dark:text-forest-50">
      <header className="border-b border-hairline/60 bg-white/60 backdrop-blur-md dark:border-forest-800/60 dark:bg-forest-900/60">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            href="/learn"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-600 hover:text-emerald-500 dark:text-forest-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Learn
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-10">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl" aria-hidden="true">
            {article.emoji}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink dark:text-paper sm:text-4xl">
            {article.title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft dark:text-forest-200/70">
            {article.summary}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 text-[11px] font-bold text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {article.readingMinutes} min read
            </span>
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {article.difficulty === "intro"
                ? "Beginner"
                : article.difficulty === "intermediate"
                  ? "Intermediate"
                  : "Deep dive"}
            </span>
          </div>
        </div>

        {/* Body sections */}
        <div className="space-y-8">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 text-lg font-bold text-ink dark:text-paper">{section.heading}</h2>
              {renderBody(section.body)}
            </section>
          ))}
        </div>

        {/* Tangible analogy */}
        <div className="mt-10 rounded-2xl border border-forest-100 bg-forest-50/40 p-5 dark:border-forest-900/30 dark:bg-forest-950/10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-forest-600 dark:text-forest-300">
            Make it tangible
          </span>
          <p className="mt-1 text-sm italic leading-relaxed text-emerald-900 dark:text-emerald-200">
            {article.analogy}
          </p>
        </div>

        {/* Did-you-know callouts */}
        <div className="mt-6 space-y-3">
          {article.callouts.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-hairline bg-white p-4 dark:border-forest-800 dark:bg-forest-900"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                {c.label}
              </span>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft dark:text-forest-200/80">
                {c.text}
              </p>
            </div>
          ))}
        </div>

        {/* Hybrid AI takeaway (client component, graceful fallback) */}
        <ArticleTakeaway slug={article.slug} />

        {/* Sources */}
        <div className="mt-10 border-t border-hairline pt-6 dark:border-forest-800">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-muted">
            Sources & further reading
          </h2>
          <ul className="space-y-2">
            {article.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-600 hover:underline dark:text-forest-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Keep-learning nudge */}
        <div className="mt-10 rounded-2xl border border-hairline bg-white p-6 text-center dark:border-forest-800 dark:bg-forest-900">
          <Sparkles className="mx-auto h-6 w-6 text-emerald-500" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-ink-soft dark:text-forest-200/80">
            Now put this knowledge into motion.
          </p>
          <Link
            href="/dashboard"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-forest-600 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            Log a green action
          </Link>
        </div>
      </article>
    </div>
  );
}
