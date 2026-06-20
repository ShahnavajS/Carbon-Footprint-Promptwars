"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Leaf, MapPin, Flame, CheckCircle, Calendar, Compass, ArrowRight } from "lucide-react";
import type { DietType, TransportType, HomeType } from "@/domain/user/types";
import type { EcoScoreResult } from "@/domain/eco-score/types";
import { getEcoLevel } from "@/domain/eco-score/levels";

export default function OnboardingPage() {
  const router = useRouter();
  const { submitOnboarding, user, isLoading } = useAuthActions();

  const [step, setStep] = React.useState(1);
  const [city, setCity] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [diet, setDiet] = React.useState<DietType | "">("");
  const [transport, setTransport] = React.useState<TransportType | "">("");
  const [home, setHome] = React.useState<HomeType | "">("");

  // Goal choices
  const [goals, setGoals] = React.useState({
    reduceTransport: false,
    reduceFood: false,
    reduceEnergy: false,
    buildHabits: false,
    learnSustainability: false,
  });

  const [errorMsg, setErrorMsg] = React.useState("");
  const [ecoScoreResult, setEcoScoreResult] = React.useState<EcoScoreResult | null>(null);

  const handleGoalToggle = (key: keyof typeof goals) => {
    setErrorMsg("");
    setGoals((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const selectedCount = Object.values(next).filter(Boolean).length;
      if (selectedCount > 3) {
        setErrorMsg("You can select up to 3 goals maximum.");
        return prev; // Revert
      }
      return next;
    });
  };

  const nextStep = () => {
    setErrorMsg("");
    if (step === 2) {
      if (!city.trim() || !country.trim()) {
        setErrorMsg("Please enter both city and country.");
        return;
      }
    }
    if (step === 3) {
      if (!diet || !transport || !home) {
        setErrorMsg("Please select an answer for all lifestyle categories.");
        return;
      }
    }
    if (step === 4) {
      const selectedCount = Object.values(goals).filter(Boolean).length;
      if (selectedCount < 1) {
        setErrorMsg("Please select at least 1 goal to focus on.");
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setErrorMsg("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Submit onboarding when entering Step 5
  React.useEffect(() => {
    if (step === 5 && !ecoScoreResult && user) {
      const handleSubmission = async () => {
        try {
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Onboarding submission timed out. Please try again.")),
              15000
            )
          );

          const res = (await Promise.race([
            submitOnboarding({
              profile: { city, country },
              sustainability: {
                dietType: diet as DietType,
                transportType: transport as TransportType,
                homeType: home as HomeType,
              },
              goals,
            }),
            timeoutPromise,
          ])) as EcoScoreResult;

          setEcoScoreResult(res);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          setErrorMsg(errorMsg || "Failed to calculate EcoScore. Please go back and retry.");
        }
      };
      handleSubmission();
    }
  }, [step, user, ecoScoreResult, city, country, diet, transport, home, goals, submitOnboarding]);

  const getFirstGoalRecommendation = () => {
    if (goals.reduceTransport)
      return "Swap one weekly car commute for public transit, cycling, or walking.";
    if (goals.reduceFood)
      return "Try introducing two fully vegan or vegetarian meals into your weekly menu.";
    if (goals.reduceEnergy)
      return "Unplug standby electronics and wash laundry at cold temperatures.";
    if (goals.buildHabits)
      return "Set a reminder to log your carbon footprint daily to establish a green streak.";
    return "Read one article about carbon offsets and calculate your household baseline carbon.";
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas dark:bg-forest-950">
      {/* Header */}
      <header className="border-b border-hairline bg-white px-4 py-4 dark:border-forest-800 dark:bg-forest-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-forest-600 dark:text-forest-300">
            <Leaf className="h-6 w-6" />
            <span>EcoScore</span>
          </div>
          {step < 5 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted dark:text-forest-200/60">
                Step {step} of 4
              </span>
              <div className="h-2 w-24 overflow-hidden rounded-full bg-canvas-soft dark:bg-forest-900">
                <div
                  className="h-full bg-forest-600 transition-all duration-300 dark:bg-forest-400"
                  style={{ width: `${(step / 4) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={step}
                  aria-valuemin={1}
                  aria-valuemax={4}
                  aria-label="Onboarding Progress"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-xl">
          {errorMsg && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400"
            >
              {errorMsg}
            </div>
          )}

          {/* STEP 1: WELCOME SCREEN */}
          {step === 1 && (
            <Card className="border-hairline/60 shadow-xl dark:border-forest-800">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-forest-50 text-forest-600 dark:bg-forest-950 dark:text-forest-300">
                  <Compass className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl font-bold">Welcome to EcoScore</CardTitle>
                <p className="mt-2 text-sm text-ink-muted dark:text-forest-200/60">
                  Learn to measure, understand, and lower your carbon impact.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Awareness hook — a real, sourced fact to awaken, not overwhelm */}
                <div className="rounded-xl border border-forest-100 bg-forest-50/50 p-4 text-center dark:border-forest-900/30 dark:bg-forest-950/10">
                  <p className="text-xs leading-relaxed text-forest-800 dark:text-emerald-300">
                    The Earth has warmed about <strong>1.1°C</strong> since pre-industrial times,
                    and CO₂ levels are at their highest in <strong>800,000 years</strong>. The good
                    news? Every choice you make today shapes what comes next.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas-soft text-ink-soft dark:bg-forest-900 dark:text-ink-muted">
                      1
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-ink-soft dark:text-paper">
                        What it is
                      </h4>
                      <p className="mt-0.5 text-xs text-ink-muted dark:text-forest-200/60">
                        An intuitive personal carbon score calculator based on real sustainability
                        metrics — turned into a living, emotional journey.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas-soft text-ink-soft dark:bg-forest-900 dark:text-ink-muted">
                      2
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-ink-soft dark:text-paper">
                        Why it matters
                      </h4>
                      <p className="mt-0.5 text-xs text-ink-muted dark:text-forest-200/60">
                        Carbon emissions are the main driver of climate change — and they come
                        mostly from everyday choices about food, transport, and energy. Measuring
                        your habits is the first step to changing them.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas-soft text-ink-soft dark:bg-forest-900 dark:text-ink-muted">
                      3
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-ink-soft dark:text-paper">
                        What you gain
                      </h4>
                      <p className="mt-0.5 text-xs text-ink-muted dark:text-forest-200/60">
                        Get personalized suggestions via Gemini AI, habit tracking logs, and
                        gamification streaks — plus a Learn hub to understand the climate itself.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Learn gateway — awareness first, data second */}
                <Link
                  href="/learn"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-forest-200 bg-forest-50/60 py-2.5 text-xs font-bold text-forest-700 transition-colors hover:bg-emerald-100 dark:border-forest-900/30 dark:bg-forest-950/20 dark:text-forest-300 dark:hover:bg-emerald-950/40"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Explore the climate first — visit Learn
                </Link>

                <Button
                  onClick={nextStep}
                  className="mt-4 w-full flex items-center justify-center gap-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: LOCATION */}
          {step === 2 && (
            <Card className="border-hairline/60 shadow-xl dark:border-forest-800">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-forest-50 text-forest-600 dark:bg-forest-950 dark:text-forest-300">
                  <MapPin className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold">Where do you live?</CardTitle>
                <p className="text-sm text-ink-muted dark:text-forest-200/60">
                  Carbon emission intensities vary based on your local power grids and climate.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  id="country"
                  label="Country"
                  placeholder="e.g. United Kingdom"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                />
                <Input
                  id="city"
                  label="City / Region"
                  placeholder="e.g. London"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />

                <div className="flex items-center justify-between gap-4 pt-4">
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button onClick={nextStep} className="flex items-center gap-2">
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: LIFESTYLE */}
          {step === 3 && (
            <Card className="border-hairline/60 shadow-xl dark:border-forest-800">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-forest-50 text-forest-600 dark:bg-forest-950 dark:text-forest-300">
                  <Flame className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold">Tell us about your lifestyle</CardTitle>
                <p className="text-sm text-ink-muted dark:text-forest-200/60">
                  These inputs form your initial baseline EcoScore.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Diet */}
                <div>
                  <h4 className="text-sm font-semibold text-ink-soft dark:text-paper">
                    Diet habits
                  </h4>
                  <div
                    className="mt-2 grid grid-cols-2 gap-2"
                    role="radiogroup"
                    aria-label="Diet habits"
                  >
                    {(["vegan", "vegetarian", "mixed", "high-meat"] as DietType[]).map((val) => (
                      <button
                        key={val}
                        type="button"
                        role="radio"
                        aria-checked={diet === val}
                        onClick={() => setDiet(val)}
                        className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-all text-left ${
                          diet === val
                            ? "border-emerald-600 bg-forest-50/50 text-forest-700 dark:border-emerald-500 dark:bg-forest-950/20 dark:text-forest-300"
                            : "border-hairline bg-white hover:bg-canvas dark:border-forest-800 dark:bg-forest-900 dark:hover:bg-slate-800"
                        }`}
                      >
                        {val === "high-meat"
                          ? "High Meat"
                          : val.charAt(0).toUpperCase() + val.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transport */}
                <div>
                  <h4 className="text-sm font-semibold text-ink-soft dark:text-paper">
                    Primary transport
                  </h4>
                  <div
                    className="mt-2 grid grid-cols-2 gap-2"
                    role="radiogroup"
                    aria-label="Primary transit"
                  >
                    {(["walk", "bicycle", "metro", "bus", "car", "mixed"] as TransportType[]).map(
                      (val) => (
                        <button
                          key={val}
                          type="button"
                          role="radio"
                          aria-checked={transport === val}
                          onClick={() => setTransport(val)}
                          className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-all text-left ${
                            transport === val
                              ? "border-emerald-600 bg-forest-50/50 text-forest-700 dark:border-emerald-500 dark:bg-forest-950/20 dark:text-forest-300"
                              : "border-hairline bg-white hover:bg-canvas dark:border-forest-800 dark:bg-forest-900 dark:hover:bg-slate-800"
                          }`}
                        >
                          {val === "mixed"
                            ? "Mixed Modes"
                            : val.charAt(0).toUpperCase() + val.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Home */}
                <div>
                  <h4 className="text-sm font-semibold text-ink-soft dark:text-paper">
                    Living environment
                  </h4>
                  <div
                    className="mt-2 grid grid-cols-3 gap-2"
                    role="radiogroup"
                    aria-label="Living home"
                  >
                    {(["shared", "apartment", "house"] as HomeType[]).map((val) => (
                      <button
                        key={val}
                        type="button"
                        role="radio"
                        aria-checked={home === val}
                        onClick={() => setHome(val)}
                        className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition-all text-center ${
                          home === val
                            ? "border-emerald-600 bg-forest-50/50 text-forest-700 dark:border-emerald-500 dark:bg-forest-950/20 dark:text-forest-300"
                            : "border-hairline bg-white hover:bg-canvas dark:border-forest-800 dark:bg-forest-900 dark:hover:bg-slate-800"
                        }`}
                      >
                        {val.charAt(0).toUpperCase() + val.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-4">
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button onClick={nextStep} className="flex items-center gap-2">
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4: GOALS */}
          {step === 4 && (
            <Card className="border-hairline/60 shadow-xl dark:border-forest-800">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-forest-50 text-forest-600 dark:bg-forest-950 dark:text-forest-300">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold">Pick your focus goals</CardTitle>
                <p className="text-sm text-ink-muted dark:text-forest-200/60">
                  Select between 1 and 3 focus areas you would like to concentrate on.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {[
                    { key: "reduceTransport" as const, label: "Reduce Transport Footprint" },
                    { key: "reduceFood" as const, label: "Reduce Food Impact" },
                    { key: "reduceEnergy" as const, label: "Reduce Energy Usage" },
                    { key: "buildHabits" as const, label: "Build Sustainable Habits" },
                    { key: "learnSustainability" as const, label: "Learn About Sustainability" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleGoalToggle(key)}
                      className={`flex w-full items-center justify-between rounded-xl border p-4 text-sm font-semibold transition-all ${
                        goals[key]
                          ? "border-emerald-600 bg-forest-50/30 text-forest-700 dark:border-emerald-500 dark:bg-forest-950/20 dark:text-forest-300"
                          : "border-hairline bg-white hover:bg-canvas dark:border-forest-800 dark:bg-forest-900"
                      }`}
                    >
                      <span>{label}</span>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                          goals[key]
                            ? "border-emerald-600 bg-forest-600 text-white dark:border-emerald-400 dark:bg-forest-400"
                            : "border-hairline-strong bg-white dark:border-forest-800"
                        }`}
                      >
                        {goals[key] && (
                          <svg
                            className="h-3.5 w-3.5 fill-none stroke-current stroke-2"
                            viewBox="0 0 24 24"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-4 pt-4">
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button onClick={nextStep} className="flex items-center gap-2">
                    <span>Calculate EcoScore</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 5: RESULTS SCREEN */}
          {step === 5 && (
            <Card className="border-hairline/60 shadow-xl dark:border-forest-800">
              <CardContent className="py-8 text-center">
                {isLoading || !ecoScoreResult ? (
                  <div className="space-y-4 py-12">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-hairline border-t-emerald-600 dark:border-forest-800 dark:border-t-emerald-400" />
                    <p className="text-sm font-medium text-ink-muted dark:text-forest-200/60">
                      Generating initial footprint baseline and scoring...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-forest-600 dark:bg-forest-950 dark:text-forest-300">
                      <Calendar className="h-7 w-7" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-300">
                      Baseline Generated
                    </span>
                    <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink dark:text-paper">
                      Your EcoScore is
                    </h2>

                    <div className="relative mx-auto my-6 flex h-40 w-40 items-center justify-center">
                      {/* Circle Graphic */}
                      <svg className="absolute inset-0 h-full w-full -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          className="stroke-slate-100 dark:stroke-slate-800"
                          strokeWidth="12"
                          fill="transparent"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          className="stroke-emerald-600 dark:stroke-emerald-400"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={440}
                          strokeDashoffset={440 - (440 * ecoScoreResult.score) / 1000}
                        />
                      </svg>
                      <div className="text-center z-10">
                        <span className="text-4xl font-extrabold text-ink dark:text-paper">
                          {ecoScoreResult.score}
                        </span>
                        <div className="text-xs font-semibold text-ink-muted dark:text-forest-200/60">
                          out of 1000
                        </div>
                      </div>
                    </div>

                    <div className="rounded-full bg-canvas-soft px-4 py-1 text-xs font-semibold text-ink-soft dark:bg-forest-900 dark:text-forest-200/80 inline-block mb-4">
                      Level {ecoScoreResult.level}: {getEcoLevel(ecoScoreResult.score).emoji}{" "}
                      {getEcoLevel(ecoScoreResult.score).name}
                    </div>

                    <p className="mx-auto max-w-sm text-sm leading-relaxed text-ink-soft dark:text-forest-200/70 mb-6">
                      {ecoScoreResult.explanation}
                    </p>

                    {/* Recommendation Card */}
                    <div className="rounded-xl border border-hairline bg-white p-4 text-left dark:border-forest-800 dark:bg-forest-900 mb-6">
                      <span className="text-xs font-bold text-forest-600 dark:text-forest-300">
                        🎯 Recommended Starting Habit
                      </span>
                      <p className="mt-1 text-xs text-ink-soft dark:text-forest-200/80 font-medium">
                        {getFirstGoalRecommendation()}
                      </p>
                    </div>

                    <Button
                      onClick={() => router.push("/dashboard")}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <span>Enter Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
