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
import {
  Leaf,
  LogOut,
  Award,
  Sparkles,
  History,
  TrendingUp,
  Plus,
  Flame,
  Globe,
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
      let msg = `Logged ${actionType}! +${result.activity.ecoPoints} points.`;
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
  const carbonSavedPercent = Math.min(
    100,
    Math.round((carbonSavedSoFar / monthlySavingsGoal) * 100)
  );
  const remainingSavings = Math.max(0, monthlySavingsGoal - carbonSavedSoFar);

  // Carbon budget color configuration
  let budgetColor = "text-red-500 dark:text-red-400";
  let budgetRingClass = "stroke-red-500 dark:stroke-red-400";
  let budgetBgClass = "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400";

  if (carbonSavedPercent >= 70) {
    budgetColor = "text-emerald-600 dark:text-emerald-400";
    budgetRingClass = "stroke-emerald-600 dark:stroke-emerald-400";
    budgetBgClass = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400";
  } else if (carbonSavedPercent >= 30) {
    budgetColor = "text-amber-500 dark:text-amber-400";
    budgetRingClass = "stroke-amber-500 dark:stroke-amber-400";
    budgetBgClass = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
  }

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

        {/* TOP METRICS SECTION */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. EcoScore Card */}
          <Card className="border-slate-200/60 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  EcoScore
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
                  Current Streak
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

          {/* 3. Carbon Budget Progress */}
          <Card className="border-slate-200/60 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900 sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Carbon Budget Savings
                </CardTitle>
                <Globe className="h-5 w-5 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4 py-2">
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{carbonSavedSoFar.toFixed(1)}</span>
                  <span className="text-xs text-slate-400">/ 100 kg CO₂</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {remainingSavings.toFixed(1)} kg remaining to goal
                </p>
                <div
                  className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${budgetBgClass}`}
                >
                  {carbonSavedPercent}% Completed
                </div>
              </div>

              {/* Budget Savings Progress Ring */}
              {/* circumference of r=34 = 2π×34 ≈ 213.6 — dashoffset drives fill */}
              <div className="relative h-20 w-20 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className={budgetRingClass}
                    strokeWidth="6"
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={213.6}
                    strokeDashoffset={213.6 * (1 - carbonSavedPercent / 100)}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <div
                  className={`absolute inset-0 flex items-center justify-center text-xs font-extrabold ${budgetColor}`}
                >
                  {carbonSavedPercent}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI INSIGHTS & RECOMMENDATIONS SECTION */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* AI Weekly Insight Card */}
          <Card className="border-slate-200/60 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Weekly AI Insight
                </CardTitle>
                <Link
                  href="/simulator"
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Simulator
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {insight ? (
                <div
                  className="space-y-3"
                  onClick={() => markViewed(insight.id, insight.generatedAt)}
                >
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {insight.content}
                  </p>
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3 space-y-1.5">
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      ✅ Carbon Saved: {insight.metrics?.carbonSaved}kg
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      📈 Points Earned: +{insight.metrics?.pointsEarned}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-slate-200 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                    No insight yet. Generate your first AI weekly insight.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateInsights}
                    isLoading={isGenerating}
                    disabled={isGenerating}
                    className="text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Generate Insight
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations Strip */}
          <Card className="border-slate-200/60 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900">
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
                <div className="py-6 text-center">
                  <Trophy className="mx-auto h-8 w-8 text-slate-200 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    No recommendations yet. Generate insights above to receive personalized
                    suggestions.
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
                      <p className="text-[10px] text-emerald-600 font-semibold dark:text-emerald-400 mt-1">
                        -{rec.estimatedCarbonSaved}kg CO₂ · +{rec.estimatedPoints} pts
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
            <Card className="border-slate-200/60 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Plus className="h-5 w-5 text-emerald-600" />
                  <span>Quick Log Activity</span>
                </CardTitle>
                <CardDescription>
                  Earn EcoPoints and reduce your carbon footprint in under 10 seconds.
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
            <Card className="border-slate-200/60 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900 h-full flex flex-col">
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
        <Card className="border-slate-200/60 shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900">
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
              <div className="text-center py-10 text-slate-400">
                <p className="text-sm">No actions recorded yet.</p>
                <p className="text-xs mt-1">
                  Use the quick log forms above to log your first activity!
                </p>
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
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-950 dark:text-white">
                          +{act.ecoPoints} EcoPoints
                        </p>
                        <p className="text-[10px] text-emerald-600 font-bold dark:text-emerald-400 mt-0.5">
                          -{act.carbonReduction.toFixed(1)}kg CO₂ saved
                        </p>
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
