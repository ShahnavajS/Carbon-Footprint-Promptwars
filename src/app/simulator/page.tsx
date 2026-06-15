"use client";

import * as React from "react";
import Link from "next/link";
import { useSimulator } from "@/hooks/use-simulator";
import { useAuthActions } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TerraBiome } from "../dashboard/_components/terra-biome";
import { ArrowLeft, Zap, Leaf, TreePine, Car, IndianRupee, Sparkles, Play } from "lucide-react";
import type { SimulatorCategory } from "@/domain/simulator/types";

const CATEGORY_STYLES: Record<SimulatorCategory, { bg: string; badge: string; icon: string }> = {
  transport: {
    bg: "bg-blue-50/60 dark:bg-blue-950/20",
    badge:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/50",
    icon: "🚌",
  },
  food: {
    bg: "bg-amber-50/60 dark:bg-amber-950/20",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/50",
    icon: "🥗",
  },
  energy: {
    bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/50",
    icon: "⚡",
  },
};

export default function SimulatorPage() {
  const { dbUser } = useAuthActions();
  const { scenarios, selectedScenario, result, isRunning, error, selectScenario, runSimulation } =
    useSimulator();

  const [activeCategory, setActiveCategory] = React.useState<SimulatorCategory | "all">("all");

  const filtered =
    activeCategory === "all" ? scenarios : scenarios.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Header */}
      <nav className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/60 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
            <Zap className="h-5 w-5" />
            <span>What-If Simulator</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <main id="main-content" className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">
            What if you changed one habit?
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Select a sustainability scenario below and run a simulation. Watch how your carbon
            savings, EcoScore, and money saved compile over a year—and preview how it heals your
            Terra Biome.
          </p>
        </div>

        {/* Category Filter */}
        <div
          className="flex flex-wrap gap-2 justify-center"
          role="group"
          aria-label="Filter scenarios by category"
        >
          {(["all", "transport", "food", "energy"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all capitalize ${
                activeCategory === cat
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-650 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
              }`}
            >
              {cat === "all"
                ? "🌍 All Scenarios"
                : cat === "transport"
                  ? "🚌 Transport"
                  : cat === "food"
                    ? "🥗 Food"
                    : "⚡ Energy"}
            </button>
          ))}
        </div>

        {/* Scenario Grid */}
        <section aria-label="Scenario selection">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((scenario) => {
              const style = CATEGORY_STYLES[scenario.category];
              const isSelected = selectedScenario?.id === scenario.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => selectScenario(scenario.id)}
                  aria-pressed={isSelected}
                  className={`text-left rounded-2xl p-5 border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/45 shadow-md dark:bg-emerald-950/20 dark:border-emerald-400"
                      : `border-transparent ${style.bg} hover:border-slate-200 dark:hover:border-slate-850`
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-2xl">{style.icon}</span>
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}
                    >
                      {scenario.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {scenario.label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {scenario.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    <Leaf className="h-3.5 w-3.5" />-{scenario.carbonSavedPerOccurrence}kg CO₂ per
                    action
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Run Button */}
        {selectedScenario && (
          <div className="flex justify-center pt-2">
            <Button
              size="lg"
              onClick={runSimulation}
              isLoading={isRunning}
              disabled={isRunning}
              className="gap-2 px-8 rounded-full shadow-md hover:shadow-lg transition-all"
              aria-label={`Run simulation for ${selectedScenario.label}`}
            >
              <Play className="h-4 w-4 fill-current" />
              Project Future Impact
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl bg-red-50 border border-red-150 p-4 text-xs font-semibold text-red-700 dark:bg-red-950/20 dark:text-red-400 max-w-md mx-auto text-center"
          >
            {error}
          </div>
        )}

        {/* Results Panel */}
        {result && (
          <section
            aria-live="polite"
            aria-label="Simulation results"
            className="space-y-8 animate-in fade-in duration-500"
          >
            <hr className="border-slate-200/60 dark:border-slate-800" />

            <div className="text-center">
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
                Ecosystem Forecast Report
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Projected cumulative stats if this ritual is kept for a year.
              </p>
            </div>

            {/* Visual Biome Forecast Preview */}
            {dbUser && (
              <div className="max-w-xl mx-auto space-y-3">
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center flex items-center justify-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Projected Biome Health (1 Year)</span>
                </h3>
                <TerraBiome
                  ecoScore={Math.min(1000, dbUser.score.ecoScore + result.ecoScoreImpact)}
                  level={Math.min(5, dbUser.score.level + Math.floor(result.ecoScoreImpact / 200))}
                  streak={dbUser.score.streak}
                  carbonSaved={(dbUser.score.carbonSaved || 0) + result.annualCarbonSaved}
                  monthlyGoal={100}
                />
              </div>
            )}

            {/* Metric Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* CO2 Saved */}
              <Card className="border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/10 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      CO₂ Saved/Year
                    </span>
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                    {result.annualCarbonSaved}
                    <span className="text-base font-semibold ml-1">kg</span>
                  </p>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 mt-1 font-bold">
                    {result.monthlyCarbonSaved} kg / month
                  </p>
                </CardContent>
              </Card>

              {/* EcoScore Impact */}
              <Card className="border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-950/10 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                      EcoScore Gain
                    </span>
                  </div>
                  <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-300">
                    +{result.ecoScoreImpact}
                    <span className="text-base font-semibold ml-1">pts</span>
                  </p>
                  <p className="text-[10px] text-blue-600/80 dark:text-blue-400/70 mt-1 font-bold">
                    Over 1 year period
                  </p>
                </CardContent>
              </Card>

              {/* Money Saved */}
              <Card className="border-amber-100 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/10 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <IndianRupee className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                      Money Saved
                    </span>
                  </div>
                  <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-300">
                    ₹{result.annualMoneySaved.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70 mt-1 font-bold">
                    Per year in savings
                  </p>
                </CardContent>
              </Card>

              {/* Tree Equivalent */}
              <Card className="border-green-100 bg-green-50/30 dark:border-green-900/30 dark:bg-green-950/10 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TreePine className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
                      Tree Equivalent
                    </span>
                  </div>
                  <p className="text-3xl font-extrabold text-green-700 dark:text-green-300">
                    {result.treeEquivalent}
                    <span className="text-base font-semibold ml-1">trees</span>
                  </p>
                  <p className="text-[10px] text-green-600/80 dark:text-green-400/70 mt-1 flex items-center gap-1 font-bold">
                    <Car className="h-3.5 w-3.5" />
                    {result.carKmEquivalent.toLocaleString()} km driving avoided
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Narrative Analysis */}
            {result.aiExplanation && (
              <Card className="border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="pb-2 bg-slate-50/50 dark:bg-slate-950/20">
                  <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-slate-500">
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    AI Forecaster Insight
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p
                    className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium"
                    aria-live="polite"
                  >
                    &ldquo;{result.aiExplanation}&rdquo;
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Empty state visual */}
        {!selectedScenario && !result && (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl max-w-md mx-auto space-y-4">
            <svg
              className="mx-auto h-16 w-16 text-slate-350 dark:text-slate-700 animate-pulse"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M32 20V28M32 36H32.01"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-750 dark:text-slate-300">
                Awaiting Forecast Parameters
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                Select one of the daily habit scenarios above and project how your action ripples
                across the earth.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
