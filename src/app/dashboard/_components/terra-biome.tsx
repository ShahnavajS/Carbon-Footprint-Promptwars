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

  // Determine emotional status, message, and image state
  let statusText = "Tending the soil";
  let statusEmoji = "🌱";
  let biomeName = "Seedling Globe";
  let description = "Your ecosystem is starting its journey. Feed it with green actions today!";
  let biomeColorClass = "from-amber-100 to-emerald-50 dark:from-slate-900 dark:to-emerald-950/20";
  let textColorClass = "text-amber-800 dark:text-amber-400";
  let earthImage = "/earth-states/polluted_earth.png";

  if (percent >= 90 || level >= 5) {
    statusText = "Climate Champion World";
    statusEmoji = "👑🌍";
    biomeName = "Gaea Sanctuary";
    description =
      "You have unlocked the ultimate carbon neutrality state! A model ecosystem of harmony.";
    biomeColorClass =
      "from-purple-100 via-emerald-50 to-teal-100 dark:from-indigo-950/40 dark:via-slate-900 dark:to-teal-950/20";
    textColorClass = "text-purple-800 dark:text-purple-400";
    earthImage = "/earth-states/champion_earth.png";
  } else if (percent >= 70 || level >= 4) {
    statusText = "Thriving Canopy";
    statusEmoji = "🦊🌳";
    biomeName = "Emerald Sanctuary";
    description = "Your environment is lush and resilient! Diverse wildlife is returning.";
    biomeColorClass =
      "from-emerald-100 via-teal-50 to-green-100 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20";
    textColorClass = "text-emerald-800 dark:text-emerald-400";
    earthImage = "/earth-states/emerald_sanctuary.png";
  } else if (percent >= 40 || level >= 3) {
    statusText = "Budding Meadow";
    statusEmoji = "🌻🌿";
    biomeName = "Whispering Grassland";
    description = "Fresh shoots are spreading. The air is clearing up as you log actions.";
    biomeColorClass =
      "from-emerald-50 via-slate-50 to-amber-50 dark:from-slate-900 dark:via-emerald-950/10 dark:to-slate-900";
    textColorClass = "text-emerald-700 dark:text-emerald-400";
    earthImage = "/earth-states/growing_ecosystem.png";
  } else if (percent >= 15 || level >= 2) {
    statusText = "Young Shoot";
    statusEmoji = "🌱☁️";
    biomeName = "Misty Valley";
    description =
      "A little hazy, but a young shoot has broken the soil. Keep going to clear the mist!";
    biomeColorClass = "from-slate-100 to-amber-50 dark:from-slate-950 dark:to-slate-900";
    textColorClass = "text-slate-700 dark:text-slate-400";
    earthImage = "/earth-states/recovering_earth.png";
  } else {
    statusText = "Tending the soil";
    statusEmoji = "🌋☠️";
    biomeName = "Seedling Globe";
    description = "Your ecosystem is starting its journey. Feed it with green actions today!";
    biomeColorClass = "from-amber-100 to-emerald-50 dark:from-slate-900 dark:to-emerald-950/20";
    textColorClass = "text-amber-800 dark:text-amber-400";
    earthImage = "/earth-states/polluted_earth.png";
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
          <div className="relative h-32 w-32 rounded-full overflow-hidden shadow-inner border-2 border-white dark:border-slate-800 flex items-center justify-center animate-float-custom bg-slate-100 dark:bg-slate-950">
            {/* The Earth Image */}
            <img
              src={earthImage}
              alt={biomeName}
              className="h-full w-full object-cover transition-opacity duration-700"
            />

            {/* Glowing Haze Overlay if savings are low */}
            {percent < 30 && (
              <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-950/15 backdrop-blur-[0.5px] transition-all pointer-events-none" />
            )}
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
