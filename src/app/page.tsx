import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HeroCtas } from "./_components/hero-ctas";
import { Leaf, Sparkles, Flame, Compass, Heart } from "lucide-react";

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
    <div className="flex min-h-screen flex-col bg-amber-50/20 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 border-b border-slate-200/40 bg-white/60 backdrop-blur-md dark:border-slate-900/60 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
            <Leaf className="h-6 w-6" />
            <span className="tracking-tight text-lg">EcoScore</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold hover:text-emerald-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        aria-labelledby="hero-heading"
        className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-16 text-center lg:py-24"
      >
        <div className="absolute inset-0 bg-radial-from-t from-emerald-100/30 via-transparent to-transparent dark:from-emerald-950/10 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400 uppercase tracking-wider">
            🌱 A New Way to Care for the Earth
          </span>

          <h1
            id="hero-heading"
            className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl dark:text-white max-w-3xl mx-auto leading-tight"
          >
            Small choices today.
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
              A healthier planet tomorrow.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            EcoScore makes personal climate action a narrative journey of hope and growth. Nurture
            your virtual Terra Biome, complete daily rituals, and connect emotionally with the
            impact of your daily choices.
          </p>

          <HeroCtas />
        </div>

        {/* Hero Illustration */}
        <div className="relative mt-12 w-full max-w-3xl px-4 animate-float">
          <div className="absolute inset-0 -z-10 bg-radial-gradient from-emerald-400/20 to-transparent blur-3xl rounded-full" />
          <img
            src="/illustrations/hero_planet.png"
            alt="Illustrative floating miniature green planet being nurtured by people"
            className="mx-auto rounded-3xl border border-slate-200/50 shadow-2xl dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs max-h-[380px] object-contain"
          />
        </div>
      </section>

      {/* Before / After Concept Section */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
            Transforming tracking into meaning
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Traditional carbon trackers feel like auditing software. EcoScore turns climate metrics
            into a living story.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Before */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm opacity-85">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>❌ The Old Way</span>
            </h3>
            <div className="space-y-4">
              <div className="h-24 rounded-xl bg-slate-50 border border-slate-200 p-4 dark:bg-slate-950/40 dark:border-slate-850 flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-400">Carbon Budget Remaining</span>
                <span className="text-2xl font-extrabold text-slate-500">421.2 kg CO₂</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-350" />
                  Numbers carry zero emotional relevance to your daily life.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-350" />
                  High interaction friction makes daily logging feel like a chore.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-350" />
                  Negative guilt-based feedback loops lead to app fatigue and deletion.
                </li>
              </ul>
            </div>
          </div>

          {/* After */}
          <div className="rounded-2xl border border-emerald-250 bg-emerald-50/20 p-6 dark:border-emerald-900/30 dark:bg-emerald-950/10 shadow-md ring-2 ring-emerald-500/10">
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>🌿 The EcoScore Way</span>
            </h3>
            <div className="space-y-4">
              <div className="h-24 rounded-xl bg-emerald-50 border border-emerald-100 p-4 dark:bg-emerald-950/30 dark:border-emerald-900/20 flex flex-col justify-center">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Your Biome Health
                </span>
                <span className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">
                  Level 3 · Whispering Grassland
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold dark:text-emerald-400 mt-1">
                  Saved equivalent to a tree absorbing carbon for 68 days!
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Watch trees sprout and sky clear as you save emissions.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Relatable analogies show physical equivalents of your logs.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Compassionate AI coach cheers your steps rather than listing failures.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features-section"
        aria-labelledby="features-heading"
        className="mx-auto w-full max-w-6xl px-4 py-16 border-t border-slate-200/40 dark:border-slate-800/60"
      >
        <div className="text-center space-y-3">
          <h2
            id="features-heading"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white"
          >
            Built for connection and longevity
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Combining climate behavior change psychology with beautiful, mindful design.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="transition-all hover:shadow-md border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl"
              >
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-55 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-base font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer
        role="contentinfo"
        className="border-t border-slate-200/40 py-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500"
      >
        <p>© {new Date().getFullYear()} EcoScore. A Personal Climate Journey.</p>
      </footer>
    </div>
  );
}
