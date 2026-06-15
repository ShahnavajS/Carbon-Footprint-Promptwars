"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@/hooks/use-auth";
import { useActivities } from "@/hooks/use-activities";
import { useInsights } from "@/hooks/use-insights";
import { useRecommendations } from "@/hooks/use-recommendations";
import { useOptimizedDashboard } from "@/hooks/use-optimized-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { InstallAppBanner } from "@/components/ui/install-banner";
import { trackEvent } from "@/services/analytics";
import { TerraBiome } from "./_components/terra-biome";
import { AnalogyEngine } from "@/lib/analogy-engine";
import {
  Leaf,
  LogOut,
  Award,
  Sparkles,
  History,
  TrendingUp,
  Flame,
  Activity,
  CheckSquare,
  Zap,
  Trophy,
  ChevronRight,
  ThumbsUp,
  X,
} from "lucide-react";
import type { ActivityCategory, ActionType } from "@/domain/activity/types";

interface DashboardActivity {
  id: string;
  userId: string;
  type: string;
  category: string;
  carbonReduction: number;
  ecoPoints: number;
  timestamp: number;
  createdAt: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { dbUser, signOut, isLoading: authLoading } = useAuthActions();
  const { challenges, logAction } = useActivities();
  const { isGenerating, generateInsights, markViewed } = useInsights();
  const {
    recommendations,
    actionLoading: recActionLoading,
    accept: acceptRec,
    dismiss: dismissRec,
  } = useRecommendations();

  // Use optimized parallel data fetching
  const {
    activities,
    insight,
    loading: dashboardLoading,
    refresh: refreshDashboard,
  } = useOptimizedDashboard();

  const [logSuccessMsg, setLogSuccessMsg] = React.useState("");
  const [loggingAction, setLoggingAction] = React.useState<string | null>(null);

  // Pagination state for activities
  const [activityPage, setActivityPage] = React.useState(1);
  const [allActivities, setAllActivities] = React.useState<DashboardActivity[]>([]);
  const [hasMoreActivities, setHasMoreActivities] = React.useState(true);
  const [loadingMoreActivities, setLoadingMoreActivities] = React.useState(false);

  // Track dashboard view
  React.useEffect(() => {
    if (dbUser) {
      trackEvent("dashboard_viewed", { userId: dbUser.uid });
    }
  }, [dbUser]);

  // Initialize activities when optimized data loads
  React.useEffect(() => {
    if (activities && activities.length > 0) {
      setAllActivities(activities);
      setActivityPage(1);
    }
  }, [activities]);

  // Cleanup toast message after delay
  React.useEffect(() => {
    if (!logSuccessMsg) return;

    const timeoutId = setTimeout(() => setLogSuccessMsg(""), 4000);
    return () => clearTimeout(timeoutId);
  }, [logSuccessMsg]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  const handleQuickLog = async (category: ActivityCategory, actionType: ActionType) => {
    setLoggingAction(actionType);
    setLogSuccessMsg("");
    try {
      const result = await logAction(category, actionType);
      const analogy = AnalogyEngine.getPrimaryAnalogyText(result.activity.carbonSaved);
      let msg = `Logged ${actionType}! You saved ${result.activity.carbonSaved}kg of CO₂ — ${analogy}`;
      if (result.challengeCompleted) {
        msg += " 🎉 Daily Challenge completed! Double rewards added.";
      }
      setLogSuccessMsg(msg);
      // Refresh dashboard after logging
      refreshDashboard();
    } catch (err) {
      console.error("Failed to log activity:", err);
    } finally {
      setLoggingAction(null);
    }
  };

  // Load more activities for pagination
  const loadMoreActivities = async () => {
    if (!dbUser || loadingMoreActivities || !hasMoreActivities) return;

    setLoadingMoreActivities(true);
    try {
      const nextPage = activityPage + 1;
      const res = await fetch(
        `/api/activities/recent?userId=${dbUser.uid}&limit=10&page=${nextPage}`
      );
      const response = await res.json();
      const { data: newActivities = [], hasMore = false } = response;

      if (Array.isArray(newActivities)) {
        setAllActivities([...allActivities, ...(newActivities as DashboardActivity[])]);
      }
      setActivityPage(nextPage);
      setHasMoreActivities(hasMore);
    } catch (error) {
      console.error("Failed to load more activities:", error);
    } finally {
      setLoadingMoreActivities(false);
    }
  };

  if (authLoading || dashboardLoading || !dbUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800 dark:border-t-emerald-400" />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const { profile, score } = dbUser;

  // Calculate live weekly change: points earned in last 7 days / 5 (since +1 EcoScore per 5 points)
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyActivities = allActivities.filter((a) => a.createdAt >= oneWeekAgo);
  const weeklyPoints = weeklyActivities.reduce((acc, curr) => acc + curr.ecoPoints, 0);
  const weeklyChange = Math.round(weeklyPoints / 5);

  // Carbon Budget progress calculations
  const monthlySavingsGoal = 100; // 100 kg CO2 target
  const carbonSavedSoFar = score.carbonSaved || 0;

  // Daily Challenge calculations
  const completedChallenges = challenges.filter((c) => c.completed).length;

  // Last completed activity details
  const lastActivity = allActivities[0];
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* Header Navigation */}
      <nav className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
            <Leaf className="h-6 w-6" />
            <span className="tracking-tight text-lg">EcoScore</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-sm font-semibold hidden sm:inline-block text-slate-700 dark:text-slate-300">
              Hello, {profile.name}!
            </span>
            <Link href="/journey">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5"
                aria-label="My sustainability journey"
              >
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Journey</span>
              </Button>
            </Link>
            <Link href="/simulator">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5"
                aria-label="What-if simulator"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Simulator</span>
              </Button>
            </Link>
            <Link href="/history">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5"
                aria-label="View history log"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History Log</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-1.5"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Dynamic Success Toast */}
        {logSuccessMsg && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-md text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400 animate-slide-in"
          >
            <Sparkles className="h-5 w-5 shrink-0" />
            <span className="text-sm font-semibold">{logSuccessMsg}</span>
          </div>
        )}

        {/* TERRA ECOSYSTEM COMPANION BIOME */}
        <TerraBiome
          ecoScore={score.ecoScore}
          level={score.level}
          streak={score.streak}
          carbonSaved={carbonSavedSoFar}
          monthlyGoal={monthlySavingsGoal}
        />

        {/* MONTHLY REPORT CARD WIDGET */}
        <Card className="border-emerald-250 bg-linear-to-br from-emerald-500/5 to-teal-500/5 dark:border-emerald-900/20 dark:bg-emerald-950/5 shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Latest Monthly Report
              </span>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Trophy className="h-4.5 w-4.5 text-amber-500" />
                <span>Sanctuary Recovery Report</span>
              </CardTitle>
            </div>
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1 rounded-full uppercase tracking-wider">
              May 2026
            </span>
          </CardHeader>
          <CardContent className="pt-4 grid gap-4 sm:grid-cols-3">
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                Carbon Prevented
              </span>
              <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
                24.5 kg CO₂
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                Sparing greenhouse gas the volume of 955 balloons!
              </span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                Vitality Score
              </span>
              <span className="text-lg font-extrabold text-blue-700 dark:text-blue-400 mt-0.5">
                +125 Points
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                You maintained a peak 5-day care streak.
              </span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                Primary Habit
              </span>
              <span className="text-lg font-extrabold text-amber-700 dark:text-amber-400 mt-0.5">
                🚌 Commute
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                Riding the metro was your biome&apos;s biggest win.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* TOP METRICS SECTION */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* 1. EcoScore Card */}
          <Card className="border-slate-200/60 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  EcoScore Vitality
                </CardTitle>
                <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-slate-950 dark:text-white">
                  {score.ecoScore}
                </span>
                <span className="text-xs text-slate-400">/ 1000</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Level {score.level}
                </span>
                {weeklyChange > 0 ? (
                  <span className="flex items-center gap-0.5 text-emerald-600 font-semibold dark:text-emerald-400">
                    <TrendingUp className="h-3 w-3" />+{weeklyChange} this week
                  </span>
                ) : (
                  <span className="text-slate-400">0 change this week</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. Streak Card */}
          <Card className="border-slate-200/60 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Nurturing Streak
                </CardTitle>
                <Flame className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-slate-950 dark:text-white">
                  {score.streak}
                </span>
                <span className="text-xs text-slate-400 font-bold">days</span>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 truncate">
                {lastActivity ? (
                  <>
                    Last logged:{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {lastActivity.type}
                    </strong>{" "}
                    ({formatTimeAgo(lastActivity.createdAt)})
                  </>
                ) : (
                  "Log an activity today to start a streak!"
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI INSIGHTS & RECOMMENDATIONS SECTION */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* AI Weekly Insight Card (Redesigned into a warm nature journal format) */}
          <Card className="border-emerald-150 bg-linear-to-tr from-emerald-50/60 via-teal-50/20 to-amber-50/40 dark:from-slate-900/60 dark:to-teal-950/20 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 border-b border-emerald-100/50 dark:border-slate-800/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-extrabold flex items-center gap-2 uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
                  <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
                  Weekly Nature Reflection
                </CardTitle>
                <Link
                  href="/simulator"
                  className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline dark:text-emerald-400 uppercase tracking-wider"
                >
                  <Zap className="h-3 w-3" />
                  Forecaster
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {insight ? (
                <div
                  className="space-y-4 cursor-pointer"
                  onClick={() => markViewed(insight.id, insight.generatedAt)}
                >
                  <h4 className="text-base font-extrabold text-slate-950 dark:text-white leading-snug">
                    &ldquo;{insight.title}&rdquo;
                  </h4>
                  <p className="text-xs text-slate-650 dark:text-slate-450 leading-relaxed font-medium italic">
                    {insight.content}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="rounded-xl bg-white/60 dark:bg-slate-900/40 border border-emerald-100/40 p-2.5">
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">
                        Biggest Win
                      </span>
                      <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 mt-1">
                        {insight.biggestWin || "Nurturing the canopy"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/60 dark:bg-slate-900/40 border border-emerald-100/40 p-2.5">
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">
                        Next Step
                      </span>
                      <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 mt-1">
                        {insight.nextStep || "One green step today"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <svg
                    className="mx-auto h-12 w-12 text-slate-350 dark:text-slate-700"
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
                      strokeDasharray="3 3"
                    />
                    <path
                      d="M32 20V28M32 36H32.01"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                      Reflection Journal is Empty
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                      Log activities to let Gemini compose your weekly climate reflection report.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateInsights}
                    isLoading={isGenerating}
                    disabled={isGenerating}
                    className="text-xs rounded-full px-5"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Compose Reflection
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations Strip */}
          <Card className="border-slate-200/60 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  AI Recommendations
                </CardTitle>
                <Link
                  href="/journey"
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Journey <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <svg
                    className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700"
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
                      strokeDasharray="3 3"
                    />
                    <path
                      d="M22 32H42"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    No recommendations yet. Complete insights to generate suggestions.
                  </p>
                </div>
              ) : (
                recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40"
                  >
                    <div className="text-lg shrink-0 mt-0.5">
                      {rec.category === "food" ? "🥗" : rec.category === "transport" ? "🚌" : "⚡"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {rec.action}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {rec.reason}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-extrabold dark:text-emerald-400 mt-1">
                        -{rec.estimatedCarbonSaved}kg CO₂ (+{rec.estimatedPoints} pts) ·{" "}
                        {AnalogyEngine.getPrimaryAnalogyText(rec.estimatedCarbonSaved)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => acceptRec(rec.id, rec.category)}
                        disabled={recActionLoading === rec.id}
                        aria-label={`Accept recommendation: ${rec.action}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-950/30 dark:text-emerald-400"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => dismissRec(rec.id)}
                        disabled={recActionLoading === rec.id}
                        aria-label={`Dismiss recommendation: ${rec.action}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* QUICK LOG & CHALLENGES SECTION */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Quick Log Form */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-slate-200/60 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-emerald-600" />
                  <span>Your Daily Care Ritual</span>
                </CardTitle>
                <CardDescription>
                  Nurture your Terra Biome and spare the atmosphere by completing small real-world
                  actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Food Category */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Food & Diet
                  </h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {[
                      { type: "Vegetarian Meal", pts: 10, co2: 0.8 },
                      { type: "Vegan Meal", pts: 15, co2: 1.0 },
                      { type: "Home Cooked Meal", pts: 5, co2: 0.3 },
                    ].map((btn) => (
                      <Button
                        key={btn.type}
                        variant="outline"
                        size="sm"
                        disabled={loggingAction !== null}
                        isLoading={loggingAction === btn.type}
                        onClick={() => handleQuickLog("food", btn.type as ActionType)}
                        className="flex flex-col h-auto py-2.5 items-center justify-center text-center rounded-xl bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/50"
                      >
                        <span className="text-xs font-bold text-slate-950 dark:text-white">
                          {btn.type}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold dark:text-emerald-400 mt-1">
                          +{btn.pts} pts • -{btn.co2}kg
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Transport Category */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Transit & Commute
                  </h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                    {[
                      { type: "Walked", pts: 15, co2: 1.5 },
                      { type: "Bicycle", pts: 15, co2: 1.3 },
                      { type: "Metro", pts: 15, co2: 1.2 },
                      { type: "Bus", pts: 10, co2: 0.8 },
                    ].map((btn) => (
                      <Button
                        key={btn.type}
                        variant="outline"
                        size="sm"
                        disabled={loggingAction !== null}
                        isLoading={loggingAction === btn.type}
                        onClick={() => handleQuickLog("transport", btn.type as ActionType)}
                        className="flex flex-col h-auto py-2.5 items-center justify-center text-center rounded-xl bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/50"
                      >
                        <span className="text-xs font-bold text-slate-950 dark:text-white">
                          {btn.type}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold dark:text-emerald-400 mt-1">
                          +{btn.pts} pts • -{btn.co2}kg
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Energy Category */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Household Energy
                  </h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {[
                      { type: "Reduced AC Usage", pts: 10, co2: 0.6 },
                      { type: "Switched Off Appliances", pts: 5, co2: 0.4 },
                      { type: "Line Dried Clothes", pts: 10, co2: 0.8 },
                    ].map((btn) => (
                      <Button
                        key={btn.type}
                        variant="outline"
                        size="sm"
                        disabled={loggingAction !== null}
                        isLoading={loggingAction === btn.type}
                        onClick={() => handleQuickLog("energy", btn.type as ActionType)}
                        className="flex flex-col h-auto py-2.5 items-center justify-center text-center rounded-xl bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/50"
                      >
                        <span className="text-xs font-bold text-slate-950 dark:text-white">
                          {btn.type}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold dark:text-emerald-400 mt-1">
                          +{btn.pts} pts • -{btn.co2}kg
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Challenges Column */}
          <div className="md:col-span-1">
            <Card className="border-slate-200/60 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900 h-full flex flex-col rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-emerald-600" />
                    <span>Today&apos;s Challenges</span>
                  </CardTitle>
                  <span className="text-xs font-bold text-slate-400">{completedChallenges}/3</span>
                </div>
                {/* Challenges progress bar */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800 mt-2">
                  <div
                    className="h-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-300"
                    style={{ width: `${(completedChallenges / 3) * 100}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                {challenges.map((ch) => (
                  <div
                    key={ch.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      ch.completed
                        ? "border-emerald-100 bg-emerald-50/30 text-slate-500 dark:border-emerald-950/20 dark:bg-emerald-950/10"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <div
                      role="checkbox"
                      aria-checked={ch.completed}
                      className={`flex h-5 w-5 items-center justify-center rounded border shrink-0 mt-0.5 transition-colors ${
                        ch.completed
                          ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400"
                          : "border-slate-300 bg-white dark:border-slate-800"
                      }`}
                    >
                      {ch.completed && (
                        <svg
                          className="h-3.5 w-3.5 fill-none stroke-current stroke-2"
                          viewBox="0 0 24 24"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold ${ch.completed ? "line-through text-slate-400 dark:text-slate-600" : "text-slate-850 dark:text-slate-200"}`}
                      >
                        {ch.title}
                      </h4>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">
                        +{ch.pointsReward} pts • -{ch.carbonReward}kg CO₂
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RECENT ACTIVITIES & TELEMETRY SECTION */}
        <Card className="border-slate-200/60 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                <span>Recent Eco Actions</span>
              </CardTitle>
              <CardDescription>Your sustainability log records.</CardDescription>
            </div>
            <Link
              href="/history"
              className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              View All History
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {allActivities.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200/60 dark:border-slate-800 rounded-2xl max-w-sm mx-auto space-y-3">
                <svg
                  className="mx-auto h-12 w-12 text-slate-350 dark:text-slate-700 animate-pulse"
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
                    strokeDasharray="3 3"
                  />
                  <path
                    d="M22 32H42M32 22V42"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-slate-705 dark:text-slate-300">
                    No Actions Recorded
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[250px] mx-auto leading-relaxed">
                    Complete your first Daily Care Ritual above to seed the activity timeline.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                  {allActivities.slice(0, 5).map((act) => (
                    <div key={act.id} className="flex items-center justify-between py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            act.category === "food"
                              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                              : act.category === "transport"
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                          }`}
                        >
                          {act.category === "food"
                            ? "🍔"
                            : act.category === "transport"
                              ? "🚌"
                              : "⚡"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-850 dark:text-slate-200">
                            {act.type}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatTimeAgo(act.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-xs font-bold text-slate-950 dark:text-white">
                          +{act.ecoPoints} EcoPoints
                        </p>
                        <p className="text-[10px] text-emerald-600 font-extrabold dark:text-emerald-400 mt-0.5">
                          -{act.carbonReduction.toFixed(1)}kg CO₂ saved
                        </p>
                        <span
                          className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-[200px] truncate block"
                          title={AnalogyEngine.getPrimaryAnalogyText(act.carbonReduction)}
                        >
                          {AnalogyEngine.getPrimaryAnalogyText(act.carbonReduction)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {hasMoreActivities && (
                  <div className="pt-4 flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={loadMoreActivities}
                      isLoading={loadingMoreActivities}
                      disabled={loadingMoreActivities}
                      className="text-xs"
                    >
                      {loadingMoreActivities ? "Loading..." : "Load More Activities"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* PWA banner */}
      <InstallAppBanner />
    </div>
  );
}
