"use client";

import * as React from "react";
import Link from "next/link";
import { useSimulator } from "@/hooks/use-simulator";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Zap, Leaf, TreePine, Car, IndianRupee, Sparkles, Play } from "lucide-react";
import type { SimulatorCategory } from "@/domain/simulator/types";

const CATEGORY_STYLES: Record<SimulatorCategory, { bg: string; badge: string; icon: string }> = {
  transport: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    icon: "🚌",
  },
  food: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    icon: "🥗",
  },
  energy: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    icon: "⚡",
  },
};

export default function SimulatorPage() {
  const { scenarios, selectedScenario, result, isRunning, error, selectScenario, runSimulation } =
    useSimulator();

  const [activeCategory, setActiveCategory] = React.useState<SimulatorCategory | "all">("all");

  const filtered =
    activeCategory === "all" ? scenarios : scenarios.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Header */}
      <nav className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/80">
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
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">
            What if you changed one habit?
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Select a sustainability scenario below and see your projected CO₂ savings, EcoScore
            improvement, and money saved — powered by real climate data and AI.
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
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all capitalize ${
                activeCategory === cat
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700"
              }`}
            >
              {cat === "all"
                ? "🌍 All"
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((scenario) => {
              const style = CATEGORY_STYLES[scenario.category];
              const isSelected = selectedScenario?.id === scenario.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => selectScenario(scenario.id)}
                  aria-pressed={isSelected}
                  className={`text-left rounded-2xl p-4 border-2 transition-all focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/60 shadow-md dark:bg-emerald-950/20 dark:border-emerald-400"
                      : `border-transparent ${style.bg} hover:border-slate-200 dark:hover:border-slate-700`
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xl">{style.icon}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}
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
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <Leaf className="h-3 w-3" />-{scenario.carbonSavedPerOccurrence}kg CO₂ per
                    action
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Run Button */}
        {selectedScenario && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={runSimulation}
              isLoading={isRunning}
              disabled={isRunning}
              className="gap-2 px-8"
              aria-label={`Run simulation for ${selectedScenario.label}`}
            >
              <Play className="h-5 w-5" />
              Run Simulation
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-400"
          >
            {error}
          </div>
        )}

        {/* Results Panel */}
        {result && (
          <section
            aria-live="polite"
            aria-label="Simulation results"
            className="space-y-6 animate-in fade-in duration-500"
          >
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white text-center">
              Your Impact Projection
            </h2>

            {/* Metric Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* CO2 Saved */}
              <Card className="border-emerald-100 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20 shadow-sm">
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
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-1">
                    {result.monthlyCarbonSaved} kg/month
                  </p>
                </CardContent>
              </Card>

              {/* EcoScore Impact */}
              <Card className="border-blue-100 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20 shadow-sm">
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
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/70 mt-1">Over 1 year</p>
                </CardContent>
              </Card>

              {/* Money Saved */}
              <Card className="border-amber-100 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20 shadow-sm">
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
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-1">Per year</p>
                </CardContent>
              </Card>

              {/* Tree Equivalent */}
              <Card className="border-green-100 bg-green-50 dark:border-green-900/30 dark:bg-green-950/20 shadow-sm">
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
                  <p className="text-xs text-green-600/80 dark:text-green-400/70 mt-1 flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {result.carKmEquivalent.toLocaleString()} km of driving avoided
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Narrative */}
            {result.aiExplanation && (
              <Card className="border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                    aria-live="polite"
                  >
                    {result.aiExplanation}
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Empty state */}
        {!selectedScenario && !result && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-600">
            <Zap className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">Select a scenario above to see your potential impact.</p>
          </div>
        )}
      </main>
    </div>
  );
}
