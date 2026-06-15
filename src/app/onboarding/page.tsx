"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Leaf, MapPin, Flame, CheckCircle, Calendar, Compass, ArrowRight } from "lucide-react";
import type { DietType, TransportType, HomeType } from "@/domain/user/types";
import type { EcoScoreResult } from "@/domain/eco-score/types";

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
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
            <Leaf className="h-6 w-6" />
            <span>EcoScore</span>
          </div>
          {step < 5 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Step {step} of 4</span>
              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 dark:bg-emerald-400"
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
            <Card className="border-slate-200/60 shadow-xl dark:border-slate-800">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <Compass className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl font-bold">Welcome to EcoScore</CardTitle>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Learn to measure, understand, and lower your carbon impact.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      1
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                        What it is
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        An intuitive personal carbon score calculator based on real sustainability
                        metrics.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      2
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                        Why it matters
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Your decisions directly shape carbon emissions. Measure habits to create
                        actual footprint progress.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      3
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                        What you gain
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Get personalized suggestions via Gemini AI, habit tracking logs, and
                        gamification streaks.
                      </p>
                    </div>
                  </div>
                </div>

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
            <Card className="border-slate-200/60 shadow-xl dark:border-slate-800">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold">Where do you live?</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
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
            <Card className="border-slate-200/60 shadow-xl dark:border-slate-800">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <Flame className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold">Tell us about your lifestyle</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  These inputs form your initial baseline EcoScore.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Diet */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
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
                            ? "border-emerald-600 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
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
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
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
                              ? "border-emerald-600 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
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
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
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
                            ? "border-emerald-600 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
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
            <Card className="border-slate-200/60 shadow-xl dark:border-slate-800">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold">Pick your focus goals</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
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
                          ? "border-emerald-600 bg-emerald-50/30 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                      }`}
                    >
                      <span>{label}</span>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                          goals[key]
                            ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400"
                            : "border-slate-300 bg-white dark:border-slate-800"
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
            <Card className="border-slate-200/60 shadow-xl dark:border-slate-800">
              <CardContent className="py-8 text-center">
                {isLoading || !ecoScoreResult ? (
                  <div className="space-y-4 py-12">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800 dark:border-t-emerald-400" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Generating initial footprint baseline and scoring...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <Calendar className="h-7 w-7" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Baseline Generated
                    </span>
                    <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
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
                        <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                          {ecoScoreResult.score}
                        </span>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          out of 1000
                        </div>
                      </div>
                    </div>

                    <div className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 inline-block mb-4">
                      Level {ecoScoreResult.level}:{" "}
                      {ecoScoreResult.level === 4
                        ? "Eco Champion"
                        : ecoScoreResult.level === 3
                          ? "Advocate"
                          : ecoScoreResult.level === 2
                            ? "Citizen"
                            : "Explorer"}
                    </div>

                    <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400 mb-6">
                      {ecoScoreResult.explanation}
                    </p>

                    {/* Recommendation Card */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-left dark:border-slate-800 dark:bg-slate-900 mb-6">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        🎯 Recommended Starting Habit
                      </span>
                      <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
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
