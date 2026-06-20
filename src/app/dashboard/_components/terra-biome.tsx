"use client";

import * as React from "react";
import { Sparkles, Cloud } from "lucide-react";
import { getEcoLevel } from "@/domain/eco-score/levels";

interface TerraBiomeProps {
  ecoScore: number;
  level: number;
  streak: number;
  carbonSaved: number;
  monthlyGoal?: number;
}

/**
 * Per-tier presentation (poetic names, copy, gradient palettes, emoji).
 * The level NUMBER and biome IMAGE are sourced from the unified config so
 * they can never drift from the rest of the app. A tier can also be reached
 * early via the carbon-saved percent milestone, which is a deliberate
 * emotional reward that doesn't affect the canonical level.
 */
interface BiomePresentation {
  statusText: string;
  statusEmoji: string;
  biomeName: string;
  description: string;
  biomeColorClass: string;
  textColorClass: string;
}

const BIOME_PRESENTATION: Record<number, BiomePresentation> = {
  1: {
    statusText: "Tending the soil",
    statusEmoji: "🌋☠️",
    biomeName: "Seedling Globe",
    description: "Your ecosystem is starting its journey. Feed it with green actions today!",
    biomeColorClass: "from-amber-100 to-emerald-50 dark:from-slate-900 dark:to-emerald-950/20",
    textColorClass: "text-amber-800 dark:text-amber-400",
  },
  2: {
    statusText: "Young Shoot",
    statusEmoji: "🌱☁️",
    biomeName: "Misty Valley",
    description:
      "A little hazy, but a young shoot has broken the soil. Keep going to clear the mist!",
    biomeColorClass: "from-slate-100 to-amber-50 dark:from-slate-950 dark:to-slate-900",
    textColorClass: "text-slate-700 dark:text-slate-400",
  },
  3: {
    statusText: "Budding Meadow",
    statusEmoji: "🌻🌿",
    biomeName: "Whispering Grassland",
    description: "Fresh shoots are spreading. The air is clearing up as you log actions.",
    biomeColorClass:
      "from-emerald-50 via-slate-50 to-amber-50 dark:from-slate-900 dark:via-emerald-950/10 dark:to-slate-900",
    textColorClass: "text-emerald-700 dark:text-emerald-400",
  },
  4: {
    statusText: "Thriving Canopy",
    statusEmoji: "🦊🌳",
    biomeName: "Emerald Sanctuary",
    description: "Your environment is lush and resilient! Diverse wildlife is returning.",
    biomeColorClass:
      "from-emerald-100 via-teal-50 to-green-100 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20",
    textColorClass: "text-emerald-800 dark:text-emerald-400",
  },
  5: {
    statusText: "Climate Champion World",
    statusEmoji: "👑🌍",
    biomeName: "Gaea Sanctuary",
    description:
      "You have unlocked the ultimate carbon neutrality state! A model ecosystem of harmony.",
    biomeColorClass:
      "from-purple-100 via-emerald-50 to-teal-100 dark:from-indigo-950/40 dark:via-slate-900 dark:to-teal-950/20",
    textColorClass: "text-purple-800 dark:text-purple-400",
  },
};

export function TerraBiome({
  ecoScore,
  level,
  streak,
  carbonSaved,
  monthlyGoal = 100,
}: TerraBiomeProps) {
  const percent = Math.min(100, Math.round((carbonSaved / monthlyGoal) * 100));

  // Canonical level/image come from the unified config. Carbon-milestone
  // percent can preview a higher tier as a reward, but the biome image
  // always tracks the real level so visuals never lie about progress.
  const unifiedLevel = getEcoLevel(ecoScore);
  const previewTier =
    percent >= 90 ? 5 : percent >= 70 ? 4 : percent >= 40 ? 3 : percent >= 15 ? 2 : 1;
  const effectiveTier = Math.max(unifiedLevel.level, previewTier, level);
  const safeTier = Math.max(1, Math.min(5, effectiveTier)) as 1 | 2 | 3 | 4 | 5;

  const presentation = BIOME_PRESENTATION[safeTier];
  const { statusText, statusEmoji, biomeName, description, biomeColorClass, textColorClass } =
    presentation;
  const earthImage = unifiedLevel.biomeImage;

  // Double down on streak animations
  const hasStreakGlow = streak >= 3;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 bg-gradient-to-b ${biomeColorClass} shadow-sm transition-all duration-700 hover:shadow-md`}
    >
      {/* Animations are defined once globally in globals.css (.animate-eco-*). */}

      <div className="flex flex-col items-center gap-8 md:flex-row">
        {/* Visual Biome Display */}
        <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
          {/* Outer Atmosphere Orbiting Cloud */}
          <div className="animate-eco-orbit pointer-events-none absolute h-full w-full">
            <div className="flex items-center gap-1 rounded-full border border-slate-100 bg-white/95 px-2 py-1 text-[9px] font-bold shadow-xs dark:border-slate-700 dark:bg-slate-800/95">
              <Cloud className="h-2.5 w-2.5 text-sky-400" />
              <span>CO₂ Saved</span>
            </div>
          </div>

          {/* Halo Glow for high streaks */}
          <div
            className={`absolute h-36 w-36 rounded-full transition-all duration-700 ${
              hasStreakGlow
                ? "animate-eco-glow bg-emerald-500/10 dark:bg-emerald-400/5"
                : "bg-transparent"
            }`}
          />

          {/* The Core Planet Circle */}
          <div className="animate-eco-float relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-inner dark:border-slate-800 dark:bg-slate-950">
            {/* The Earth Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={earthImage}
              alt={biomeName}
              className="h-full w-full object-cover transition-opacity duration-700"
            />

            {/* Glowing Haze Overlay if savings are low */}
            {percent < 30 && (
              <div className="pointer-events-none absolute inset-0 bg-slate-900/10 backdrop-blur-[0.5px] transition-all dark:bg-slate-950/15" />
            )}
          </div>

          {/* Twinkles for high streak */}
          {hasStreakGlow && (
            <>
              <Sparkles
                className="animate-eco-twinkle absolute left-6 top-2 h-3.5 w-3.5 text-amber-400"
                style={{ animationDelay: "0.5s" }}
              />
              <Sparkles
                className="animate-eco-twinkle absolute bottom-6 right-2 h-4 w-4 text-emerald-400"
                style={{ animationDelay: "1.2s" }}
              />
              <Sparkles className="animate-eco-twinkle absolute left-1 top-24 h-3 w-3 text-sky-400" />
            </>
          )}
        </div>

        {/* Narrative & Metrics */}
        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-white/80 dark:bg-slate-800/80 px-3 py-1 border border-slate-200/50 dark:border-slate-700/50 ${textColorClass}`}
            >
              <span>{statusEmoji}</span>
              <span>{statusText}</span>
            </span>
            {streak > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400">
                🔥 {streak} Day Streak
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Level {level} · {biomeName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
              {description}
            </p>
          </div>

          {/* Progress Metrics summary bar */}
          <div className="pt-2">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              <span>Ecosystem Vitality</span>
              <span>{percent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Based on monthly savings of {carbonSaved.toFixed(1)}kg / {monthlyGoal}kg CO₂. Biome
              score: {ecoScore} pts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TerraBiome;
