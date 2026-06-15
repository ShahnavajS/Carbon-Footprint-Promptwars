import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FootprintEmptyState } from "./_components/footprint-empty-state";
import { HeroCtas } from "./_components/hero-ctas";
import { Leaf, BarChart2, Zap, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "Track Your Impact",
    description:
      "Log your daily activities across transportation, food, energy, shopping, and waste to understand your carbon footprint.",
  },
  {
    icon: BarChart2,
    title: "Visualise Progress",
    description:
      "See your footprint trends over time with clear, beautiful charts that make complex data easy to understand.",
  },
  {
    icon: Zap,
    title: "AI-Powered Insights",
    description:
      "Get personalised recommendations powered by Gemini AI to help you identify the highest-impact changes you can make.",
  },
  {
    icon: ShieldCheck,
    title: "Build Green Habits",
    description:
      "Turn sustainable choices into lasting habits with streaks, badges, and gamified challenges that keep you motivated.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section
        aria-labelledby="hero-heading"
        className="relative flex flex-col items-center justify-center overflow-hidden bg-linear-to-br from-emerald-50 via-white to-teal-50 px-4 py-24 text-center dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent dark:from-emerald-900/20"
        />
        <div className="relative z-10 max-w-3xl">
          <span className="mb-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            🌱 Now in Early Access
          </span>
          <h1
            id="hero-heading"
            className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl dark:text-white"
          >
            Your planet needs a{" "}
            <span className="text-emerald-600 dark:text-emerald-400">score</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
            EcoScore helps you measure, understand, and reduce your personal carbon footprint — one
            habit at a time. Simple actions, meaningful impact.
          </p>
          <HeroCtas />
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features-section"
        aria-labelledby="features-heading"
        className="mx-auto w-full max-w-6xl px-4 py-20"
      >
        <div className="text-center">
          <h2
            id="features-heading"
            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Everything you need to go green
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Science-backed carbon tracking meets beautiful design and smart AI.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                    <Icon
                      className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Empty State Demo Section */}
      <section aria-labelledby="demo-empty-heading" className="mx-auto w-full max-w-2xl px-4 pb-24">
        <h2 id="demo-empty-heading" className="sr-only">
          Dashboard Preview
        </h2>
        <FootprintEmptyState />
      </section>

      {/* Footer */}
      <footer
        role="contentinfo"
        className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400"
      >
        <p>© {new Date().getFullYear()} EcoScore. Built for a greener planet.</p>
      </footer>
    </div>
  );
}
