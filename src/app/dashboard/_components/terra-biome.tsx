"use client";

import * as React from "react";
import { Sparkles, Cloud } from "lucide-react";

interface TerraBiomeProps {
  ecoScore: number;
  level: number;
  streak: number;
  carbonSaved: number;
  monthlyGoal?: number;
}

export function TerraBiome({
  ecoScore,
  level,
  streak,
  carbonSaved,
  monthlyGoal = 100,
}: TerraBiomeProps) {
  const percent = Math.min(100, Math.round((carbonSaved / monthlyGoal) * 100));

  // Determine emotional status and messages
  let statusText = "Tending the soil";
  let statusEmoji = "🌱";
  let biomeName = "Seedling Globe";
  let description = "Your ecosystem is starting its journey. Feed it with green actions today!";
  let biomeColorClass = "from-amber-100 to-emerald-50 dark:from-slate-900 dark:to-emerald-950/20";
  let textColorClass = "text-amber-800 dark:text-amber-400";

  if (percent >= 70) {
    statusText = "Thriving Canopy";
    statusEmoji = "🦊🌳";
    biomeName = "Emerald Sanctuary";
    description = "Your environment is lush and resilient! Diverse wildlife is returning.";
    biomeColorClass =
      "from-emerald-100 via-teal-50 to-green-100 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20";
    textColorClass = "text-emerald-800 dark:text-emerald-400";
  } else if (percent >= 30) {
    statusText = "Budding Meadow";
    statusEmoji = "🌻🌿";
    biomeName = "Whispering Grassland";
    description = "Fresh shoots are spreading. The air is clearing up as you log actions.";
    biomeColorClass =
      "from-emerald-50 via-slate-50 to-amber-50 dark:from-slate-900 dark:via-emerald-950/10 dark:to-slate-900";
    textColorClass = "text-emerald-700 dark:text-emerald-400";
  } else if (percent < 30 && carbonSaved > 0) {
    statusText = "Young Shoot";
    statusEmoji = "🌱☁️";
    biomeName = "Misty Valley";
    description =
      "A little hazy, but a young shoot has broken the soil. Keep going to clear the mist!";
    biomeColorClass = "from-slate-100 to-amber-50 dark:from-slate-950 dark:to-slate-900";
    textColorClass = "text-slate-700 dark:text-slate-400";
  }

  // Double down on streak animations
  const hasStreakGlow = streak >= 3;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 bg-gradient-to-b ${biomeColorClass} transition-all duration-700 shadow-sm hover:shadow-md`}
    >
      {/* CSS Keyframe Animations Inline */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(70px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(70px) rotate(-360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.2)); }
          50% { filter: drop-shadow(0 0 18px rgba(16, 185, 129, 0.4)); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .animate-float-custom {
          animation: float 6s ease-in-out infinite;
        }
        .animate-orbit-custom {
          animation: orbit 25s linear infinite;
        }
        .animate-glow-custom {
          animation: pulseGlow 4s ease-in-out infinite;
        }
        .animate-sway-custom {
          transform-origin: bottom center;
          animation: sway 4s ease-in-out infinite;
        }
        .animate-twinkle-custom {
          animation: twinkle 3s ease-in-out infinite;
        }
      `,
        }}
      />

      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Visual Biome Display */}
        <div className="relative flex items-center justify-center h-44 w-44 shrink-0">
          {/* Outer Atmosphere Orbiting Cloud */}
          <div className="absolute h-full w-full animate-orbit-custom pointer-events-none">
            <div className="bg-white/95 dark:bg-slate-800/95 shadow-xs rounded-full px-2 py-1 flex items-center gap-1 text-[9px] font-bold border border-slate-100 dark:border-slate-700">
              <Cloud className="h-2.5 w-2.5 text-sky-400" />
              <span>CO₂ Saved</span>
            </div>
          </div>

          {/* Halo Glow for high streaks */}
          <div
            className={`absolute h-36 w-36 rounded-full transition-all duration-700 ${
              hasStreakGlow
                ? "bg-emerald-500/10 dark:bg-emerald-400/5 animate-glow-custom"
                : "bg-transparent"
            }`}
          />

          {/* The Core Planet Circle */}
          <div className="relative h-32 w-32 rounded-full bg-linear-to-b from-sky-400 to-sky-200 dark:from-slate-900 dark:to-indigo-950 overflow-hidden shadow-inner border-2 border-white dark:border-slate-800 flex items-end justify-center animate-float-custom">
            {/* Ground Layers (Green curves) */}
            <div className="absolute inset-0 bg-linear-to-b from-sky-300 to-sky-100 dark:from-slate-900 dark:to-indigo-900 opacity-60" />

            {/* Haze Overlay if savings are low */}
            {percent < 30 && (
              <div className="absolute inset-0 bg-slate-900/15 dark:bg-slate-950/20 backdrop-blur-[0.5px] transition-all" />
            )}

            {/* Hills/Meadow Hills */}
            <svg
              className="absolute bottom-0 w-full h-16 fill-emerald-500 dark:fill-emerald-700 transition-colors duration-700"
              viewBox="0 0 100 50"
              preserveAspectRatio="none"
            >
              <path d="M0,50 Q25,20 50,35 T100,25 L100,50 Z" />
            </svg>
            <svg
              className="absolute bottom-0 w-full h-12 fill-emerald-600 dark:fill-emerald-800 opacity-90 transition-colors duration-700"
              viewBox="0 0 100 50"
              preserveAspectRatio="none"
            >
              <path d="M0,50 Q30,30 65,25 T100,35 L100,50 Z" />
            </svg>

            {/* Vegetation sprouting based on progress */}
            {percent >= 30 && (
              <div className="absolute bottom-11 left-6 flex gap-1 animate-sway-custom">
                {/* Left Tree */}
                <div className="h-5 w-2 bg-amber-800 dark:bg-amber-900 rounded-xs" />
                <div className="absolute bottom-3 -left-2 h-6 w-6 rounded-full bg-emerald-700 dark:bg-emerald-600 opacity-95" />
              </div>
            )}

            {percent >= 70 && (
              <>
                {/* Center Tall Tree */}
                <div
                  className="absolute bottom-10 left-16 flex gap-1 animate-sway-custom"
                  style={{ animationDelay: "1s" }}
                >
                  <div className="h-7 w-2.5 bg-amber-900 dark:bg-amber-950 rounded-xs" />
                  <div className="absolute bottom-4 -left-3 h-8 w-8 rounded-full bg-green-700 dark:bg-green-600 opacity-95" />
                </div>
                {/* Right Small Bush */}
                <div className="absolute bottom-8 right-6 h-4 w-5 rounded-full bg-teal-600 dark:bg-teal-700 animate-pulse" />
              </>
            )}

            {/* Basic young seedling sprout for low score */}
            {percent < 30 && (
              <div className="absolute bottom-7 left-14 h-4 w-4 text-emerald-400 dark:text-emerald-500 animate-sway-custom">
                🌱
              </div>
            )}

            {/* Sun or Moon depending on Dark Mode */}
            <div className="absolute top-3 right-6 h-6 w-6 rounded-full bg-amber-200 dark:bg-slate-300 opacity-80 animate-pulse" />

            {/* Tiny clouds */}
            <div
              className="absolute top-6 left-4 opacity-75 animate-pulse"
              style={{ animationDuration: "6s" }}
            >
              <div className="h-2.5 w-6 rounded-full bg-white dark:bg-slate-700" />
            </div>
          </div>

          {/* Twinkles for high streak */}
          {hasStreakGlow && (
            <>
              <Sparkles
                className="absolute top-2 left-6 h-3.5 w-3.5 text-amber-400 animate-twinkle-custom"
                style={{ animationDelay: "0.5s" }}
              />
              <Sparkles
                className="absolute bottom-6 right-2 h-4 w-4 text-emerald-400 animate-twinkle-custom"
                style={{ animationDelay: "1.2s" }}
              />
              <Sparkles className="absolute top-24 left-1 h-3 w-3 text-sky-400 animate-twinkle-custom" />
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
