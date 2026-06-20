"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useJourney } from "@/hooks/use-journey";
import { useAuthActions } from "@/hooks/use-auth";
import { JOURNEY_LEVELS } from "@/services/journey.service";
import { AppNav } from "@/components/layout/app-nav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Check, Sparkles } from "lucide-react";

interface MilestoneNode {
  id: string;
  title: string;
  description: string;
  type: string;
  threshold: number;
  emoji: string;
  achieved: boolean;
  progress: number;
}

export default function JourneyPage() {
  const router = useRouter();
  const {
    ecoScore,
    currentLevel,
    nextLevel,
    levelProgress,
    milestones,
    achievedMilestones,
    pointsToNextLevel,
    isLoading,
  } = useJourney();
  const { dbUser, signOut } = useAuthActions();

  const [activeNode, setActiveNode] = React.useState<MilestoneNode | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50/10 dark:bg-forest-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-hairline border-t-emerald-600 dark:border-forest-800 dark:border-t-emerald-400" />
      </div>
    );
  }

  // Helper to map milestones into level chapters
  const getMilestonesForLevel = (levelNum: number): MilestoneNode[] => {
    // Distribute milestones into logical chapters
    switch (levelNum) {
      case 1: // Beginner (0-199)
        return milestones.filter((m) =>
          ["activities_10", "score_100", "streak_3", "carbon_10"].includes(m.id)
        );
      case 2: // Conscious (200-399)
        return milestones.filter((m) => ["score_250", "streak_7"].includes(m.id));
      case 3: // Green Explorer (400-599)
        return milestones.filter((m) => ["activities_50", "score_500", "carbon_50"].includes(m.id));
      case 4: // Eco Hero (600-799)
        return milestones.filter((m) => ["score_750", "streak_30"].includes(m.id));
      case 5: // Climate Champion (800-1000)
        return milestones.filter((m) =>
          ["activities_100", "carbon_100", "score_1000"].includes(m.id)
        );
      default:
        return [];
    }
  };

  // Get positioning class for Duolingo snake trail (alternate left, center, right)
  const getNodePositionClass = (index: number) => {
    const cycle = index % 4;
    if (cycle === 0) return "translate-x-0"; // Center
    if (cycle === 1) return "translate-x-12 sm:translate-x-16"; // Right
    if (cycle === 2) return "translate-x-0"; // Center
    return "-translate-x-12 sm:-translate-x-16"; // Left
  };

  return (
    <div className="min-h-screen bg-canvas dark:bg-forest-950 text-ink dark:text-forest-50 pb-20">
      <AppNav userName={dbUser?.profile.name} onSignOut={handleSignOut} />

      {/* Main Container */}
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-12">
        {/* Progress banner */}
        <div className="flex items-center justify-end">
          <div className="text-xs font-bold bg-emerald-100 text-forest-800 dark:bg-forest-950/40 dark:text-forest-300 px-3 py-1.5 rounded-full">
            {achievedMilestones.length} / {milestones.length} Completed
          </div>
        </div>
        {/* Journey Level Hero */}
        <Card className="border-0 bg-linear-to-br from-emerald-600 to-emerald-800 text-white shadow-xl overflow-hidden relative rounded-2xl">
          <div className="absolute top-0 right-0 opacity-10 text-[120px] leading-none select-none pointer-events-none">
            {currentLevel.emoji}
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-1">
                  Active Sanctuary Level
                </p>
                <h1 className="text-3xl font-extrabold mb-1 flex items-center gap-3">
                  {currentLevel.emoji} {currentLevel.name}
                </h1>
                <p className="text-emerald-100 text-xs max-w-md mt-1 leading-relaxed">
                  {currentLevel.description}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-4xl font-extrabold">{ecoScore}</p>
                <p className="text-forest-300 text-[10px] font-bold tracking-wider">
                  VITALITY POINTS
                </p>
              </div>
            </div>

            {nextLevel && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-200">
                  <span>{currentLevel.name}</span>
                  <span>
                    {nextLevel.name} {nextLevel.emoji}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{ width: `${levelProgress * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-emerald-200 text-center font-bold">
                  {pointsToNextLevel} points to unlock the {nextLevel.name} Biome
                </p>
              </div>
            )}
            {!nextLevel && (
              <p className="text-sm font-bold text-emerald-100 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                You have reached the ultimate Gaea Sanctuary state! Perfect Climate Champion!
              </p>
            )}
          </CardContent>
        </Card>

        {/* DUOLINGO SNAKE PATH ROADMAP */}
        <section aria-label="Sanctuary Trail" className="space-y-12 relative">
          <div className="text-center">
            <h2 className="text-lg font-bold text-ink-soft dark:text-forest-100">
              The Path of Biome Recovery
            </h2>
            <p className="text-xs text-ink-muted dark:text-ink-muted">
              Complete milestones to grow your Sanctuary. Click any milestone to view details.
            </p>
          </div>

          <div className="relative flex flex-col items-center">
            {/* The Trail Map Sections */}
            {JOURNEY_LEVELS.map((level) => {
              const levelMilestones = getMilestonesForLevel(level.level);
              const isLvlCurrent = currentLevel.level === level.level;

              return (
                <div key={level.level} className="w-full relative flex flex-col items-center py-6">
                  {/* Chapter Banner Header */}
                  <div className="w-full max-w-sm rounded-xl border border-hairline/50 bg-white p-3 dark:border-forest-800 dark:bg-forest-900 shadow-xs text-center z-10 space-y-1 mb-8">
                    <span className="text-[10px] font-extrabold text-forest-600 dark:text-forest-300 uppercase tracking-widest">
                      Chapter {level.level}
                    </span>
                    <h3 className="font-extrabold text-sm text-ink dark:text-paper flex items-center justify-center gap-1.5">
                      <span>{level.emoji}</span>
                      <span>{level.name}</span>
                      {isLvlCurrent && (
                        <span className="text-[8px] font-extrabold bg-forest-600 text-white px-1.5 py-0.5 rounded-sm uppercase ml-1">
                          Current
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-ink-muted dark:text-ink-muted">
                      {level.minScore} - {level.maxScore} Score Range
                    </p>
                  </div>

                  {/* milestones nodes layout */}
                  <div className="relative flex flex-col items-center gap-8 w-full">
                    {levelMilestones.map((node, nodeIdx) => {
                      const positionClass = getNodePositionClass(nodeIdx);

                      return (
                        <div
                          key={node.id}
                          className={`relative flex flex-col items-center ${positionClass} transition-transform duration-300 z-10`}
                        >
                          {/* Circle Button */}
                          <button
                            type="button"
                            onClick={() => setActiveNode(node)}
                            className={`flex h-16 w-16 items-center justify-center rounded-full border-4 shadow-md transition-all cursor-pointer relative ${
                              node.achieved
                                ? "bg-emerald-500 border-emerald-450 hover:bg-forest-600 text-white scale-105 active:scale-95"
                                : "bg-canvas-soft border-hairline-strong text-ink-muted hover:bg-hairline dark:bg-forest-900 dark:border-forest-800"
                            }`}
                            aria-label={`Milestone: ${node.title}`}
                          >
                            <span className="text-2xl">{node.emoji}</span>

                            {/* Little badge decorator */}
                            {node.achieved ? (
                              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-emerald-500 shadow-sm text-forest-600">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-hairline dark:bg-forest-900 text-ink-muted">
                                <Lock className="h-2.5 w-2.5" />
                              </div>
                            )}
                          </button>

                          {/* Level Node Title Label */}
                          <span className="text-[10px] font-bold text-ink-muted dark:text-forest-200/60 mt-2 block select-none">
                            {node.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Tooltip Card drawer */}
          {activeNode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/50 backdrop-blur-xs animate-in fade-in duration-200">
              <Card className="w-full max-w-sm border-hairline dark:border-forest-800 bg-paper dark:bg-forest-900 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <CardHeader className="bg-canvas-soft dark:bg-forest-950/20 pb-3 flex flex-row items-center gap-3">
                  <div className="text-3xl bg-white border dark:bg-forest-900 dark:border-forest-800 rounded-xl h-14 w-14 flex items-center justify-center shadow-inner">
                    {activeNode.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-forest-800 dark:bg-forest-950/40 dark:text-forest-300 px-2 py-0.5 rounded-sm">
                      {activeNode.type} milestone
                    </span>
                    <CardTitle className="text-base font-bold mt-1 text-ink dark:text-paper truncate">
                      {activeNode.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-xs text-ink-soft dark:text-forest-200/70 leading-relaxed">
                    {activeNode.description}
                  </p>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-ink-muted">
                      <span>Requirement progress</span>
                      <span>{Math.round(activeNode.progress * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-canvas-soft dark:bg-forest-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 dark:bg-forest-400 rounded-full transition-all"
                        style={{ width: `${activeNode.progress * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-hairline dark:border-forest-800">
                    <span className="text-ink-muted">Status</span>
                    {activeNode.achieved ? (
                      <span className="font-extrabold text-forest-600 dark:text-forest-300 flex items-center gap-0.5">
                        <Check className="h-3 w-3 stroke-[3]" /> Completed
                      </span>
                    ) : (
                      <span className="font-bold text-ink-muted flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      size="sm"
                      onClick={() => setActiveNode(null)}
                      className="w-full text-xs font-semibold rounded-xl bg-forest-800 text-paper hover:bg-forest-900 dark:bg-forest-900 dark:hover:bg-slate-700"
                    >
                      Close Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
