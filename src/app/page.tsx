import * as React from "react";
import Link from "next/link";
import { CardMedia } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SectionLabel } from "@/components/ui/section-label";
import { HeroCtas } from "./_components/hero-ctas";
import { Compass, Heart, Sparkles, Flame, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Compass,
    title: "A Personal Climate Journey",
    description:
      "Your carbon footprint is not a spreadsheet. Watch your choices come alive in your personal Terra Biome—a living slice of the biosphere that grows as you build green habits.",
  },
  {
    icon: Heart,
    title: "Empathy, Not Guilt",
    description:
      "Abstract metrics like '3.2kg CO₂' are hard to feel. We translate your savings into tangible impact—like sparing party balloons of greenhouse gases or adding clean breaths of air.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Climate Coaching",
    description:
      "Get warm, supportive weekly reflections and actionable suggestions from your AI Coach, personalized to your lifestyle and goals.",
  },
  {
    icon: Flame,
    title: "Daily Care Rituals",
    description:
      "Completing simple actions—like a plant-based lunch or walking to the store—feels like watering a garden. Nurture your biome daily and build lasting streaks.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink dark:bg-forest-950 dark:text-forest-50">
      {/* Navigation — minimal, editorial */}
      <nav className="sticky top-0 z-30 border-b border-hairline bg-canvas/85 backdrop-blur-md dark:border-forest-800 dark:bg-forest-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-lg font-medium tracking-tight text-forest-700 dark:text-forest-200"
          >
            <span aria-hidden="true" className="text-xl">
              🌱
            </span>
            <span>EcoScore</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-ink-soft underline-offset-4 hover:text-forest-700 hover:underline dark:text-forest-200/80 dark:hover:text-forest-100"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-pill bg-forest-700 px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-forest-800 dark:bg-forest-600 dark:hover:bg-forest-500"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO — one monumental Fraunces headline, one media moment ── */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden px-4 pb-20 pt-20 lg:pt-28"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl space-y-7 text-center">
            <Eyebrow icon="🌱">A New Way to Care for the Earth</Eyebrow>

            <h1
              id="hero-heading"
              className="font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-7xl dark:text-paper"
            >
              Small choices today.
              <br />
              <span className="text-forest-600 dark:text-forest-300">
                A healthier planet tomorrow.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg dark:text-forest-200/80">
              EcoScore makes personal climate action a narrative journey of hope and growth. Nurture
              your virtual Terra Biome, complete daily rituals, and connect emotionally with the
              impact of your daily choices.
            </p>

            <HeroCtas />
          </div>

          {/* The one media moment — hero planet in a 22px rounded card */}
          <div className="relative mx-auto mt-16 w-full max-w-3xl">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-forest-200/30 to-clay-200/20 blur-3xl dark:from-forest-500/10 dark:to-clay-500/5" />
            <CardMedia>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustrations/hero_planet.png"
                alt="Illustrative floating miniature green planet being nurtured by people"
                className="mx-auto max-h-[420px] w-full object-cover"
              />
            </CardMedia>
          </div>

          {/* Awareness stat band — mono label, sourced fact */}
          <div className="mx-auto mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3 border-y border-hairline py-5 text-center">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-medium text-forest-700 dark:text-forest-300">
                420+
              </span>
              <span className="mono-label text-ink-muted dark:text-forest-200/60">PPM CO₂</span>
            </div>
            <span className="hidden h-5 w-px bg-hairline-strong sm:inline-block" />
            <p className="text-sm text-ink-soft dark:text-forest-200/70">
              The highest in 800,000 years.{" "}
              <Link
                href="/learn"
                className="font-medium text-forest-700 underline-offset-4 hover:underline dark:text-forest-300"
              >
                Understand why →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER — contrasting surfaces, not matching cards ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="space-y-3 text-center">
            <SectionLabel>The difference</SectionLabel>
            <h2 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl dark:text-paper">
              Transforming tracking into meaning
            </h2>
            <p className="mx-auto max-w-xl text-sm text-ink-soft dark:text-forest-200/70">
              Traditional carbon trackers feel like auditing software. EcoScore turns climate
              metrics into a living story.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-lg border border-hairline md:grid-cols-2">
            {/* Before — muted stone surface */}
            <div className="bg-canvas-soft p-8 dark:bg-forest-900/40">
              <SectionLabel className="mb-5 text-ink-muted">❌ The old way</SectionLabel>
              <div className="mb-5 border border-hairline bg-paper p-5 dark:border-forest-800 dark:bg-forest-950">
                <span className="mono-label text-ink-muted">Carbon Budget Remaining</span>
                <p className="mt-1 font-display text-3xl font-medium text-ink-muted">
                  421.2 kg CO₂
                </p>
              </div>
              <ul className="space-y-3 text-sm text-ink-soft dark:text-forest-200/70">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
                  Numbers carry zero emotional relevance to your daily life.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
                  High interaction friction makes daily logging feel like a chore.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
                  Guilt-based feedback loops lead to app fatigue and deletion.
                </li>
              </ul>
            </div>

            {/* After — forest band, inverted */}
            <div className="bg-forest-700 p-8 text-paper dark:bg-forest-800">
              <SectionLabel onDark className="mb-5">
                🌿 The EcoScore way
              </SectionLabel>
              <div className="mb-5 border border-forest-500/40 bg-forest-800/60 p-5 dark:bg-forest-900/50">
                <span className="mono-label text-forest-100/70">Your Biome Health</span>
                <p className="mt-1 font-display text-3xl font-medium text-paper">
                  Level 3 · Whispering Grassland
                </p>
                <p className="mt-1 text-xs text-forest-100/80">
                  Saved equivalent to a tree absorbing carbon for 68 days.
                </p>
              </div>
              <ul className="space-y-3 text-sm text-forest-100/90">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-forest-200" />
                  Watch trees sprout and sky clear as you save emissions.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-forest-200" />
                  Relatable analogies show physical equivalents of your logs.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-forest-200" />A
                  compassionate AI coach cheers your steps, never lists failures.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES — thin-line capability cards (not boxed) ── */}
      <section
        id="features-section"
        aria-labelledby="features-heading"
        className="border-t border-hairline px-4 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="space-y-3 text-center">
            <SectionLabel>Built for connection</SectionLabel>
            <h2
              id="features-heading"
              className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl dark:text-paper"
            >
              Climate behavior change, beautifully designed
            </h2>
            <p className="mx-auto max-w-xl text-sm text-ink-soft dark:text-forest-200/70">
              Combining climate psychology with mindful, hopeful design.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-hairline sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group bg-paper p-7 transition-colors hover:bg-canvas-soft dark:bg-forest-900 dark:hover:bg-forest-900/60"
                >
                  {/* Thin-line geometric icon, not a colored circle */}
                  <Icon
                    className="mb-4 h-6 w-6 text-forest-600 transition-transform group-hover:scale-110 dark:text-forest-300"
                    aria-hidden="true"
                    strokeWidth={1.5}
                  />
                  <h3 className="font-display text-lg font-medium leading-snug text-ink dark:text-paper">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-forest-200/70">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA — forest band ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl rounded-lg bg-forest-700 p-12 text-center text-paper dark:bg-forest-800">
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Begin your climate journey today.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-forest-100/80">
            No guilt. Just growth. Start with one green choice, and watch the world respond.
          </p>
          <Link
            href="/signup"
            className="mt-7 inline-flex items-center gap-1.5 rounded-pill bg-paper px-6 py-3 text-sm font-medium text-forest-700 transition-transform hover:scale-[1.02] dark:bg-forest-950 dark:text-forest-200"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER — mono labels, quiet ── */}
      <footer
        role="contentinfo"
        className="border-t border-hairline px-4 py-10 dark:border-forest-800"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 font-display text-base font-medium text-forest-700 dark:text-forest-200">
            <span aria-hidden="true">🌱</span> EcoScore
          </div>
          <SectionLabel>© {new Date().getFullYear()} A Personal Climate Journey</SectionLabel>
          <Link
            href="/learn"
            className="text-sm font-medium text-ink-soft underline-offset-4 hover:text-forest-700 hover:underline dark:text-forest-200/70 dark:hover:text-forest-100"
          >
            Learn the climate →
          </Link>
        </div>
      </footer>
    </div>
  );
}
