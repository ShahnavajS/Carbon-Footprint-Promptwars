"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@/hooks/use-auth";
import { useActivities } from "@/hooks/use-activities";
import { useInsights } from "@/hooks/use-insights";
import { useRecommendations } from "@/hooks/use-recommendations";
import { useOptimizedDashboard } from "@/hooks/use-optimized-dashboard";
import { AppNav } from "@/components/layout/app-nav";
import { EcoCompanion } from "@/components/mascot/eco-companion";
import { InstallAppBanner } from "@/components/ui/install-banner";
import { trackEvent } from "@/services/analytics";
import { TerraBiome } from "./_components/terra-biome";
import { MetricCards } from "./_components/metric-cards";
import { MonthlyReportCard } from "./_components/monthly-report-card";
import { WeeklyReflectionCard } from "./_components/weekly-reflection-card";
import { RecommendationsStrip } from "./_components/recommendations-strip";
import { QuickLogCard } from "./_components/quick-log-card";
import { ChallengesCard } from "./_components/challenges-card";
import { RecentActivitiesList } from "./_components/recent-activities-list";
import { AnalogyEngine } from "@/lib/analogy-engine";
import {
  buildMonthlyReport,
  getWeeklyScoreChange,
  DEFAULT_MONTHLY_GOAL_KG,
} from "@/lib/dashboard-stats";
import type { ActivityCategory, ActionType } from "@/domain/activity/types";
import { Sparkles } from "lucide-react";

/**
 * Dashboard — the authenticated hub.
 *
 * Composed from focused sub-components (see ./_components). The page itself
 * only owns: auth state, data orchestration, the log handler, and the layout.
 * All derived math lives in lib/dashboard-stats so it is testable and reused.
 */
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

  const {
    activities,
    insight,
    loading: dashboardLoading,
    refresh: refreshDashboard,
    loadMoreActivities,
    loadingMore,
    hasMoreActivities,
  } = useOptimizedDashboard();

  const [logSuccessMsg, setLogSuccessMsg] = React.useState("");
  const [loggingAction, setLoggingAction] = React.useState<string | null>(null);

  // Track dashboard view
  React.useEffect(() => {
    if (dbUser) {
      trackEvent("dashboard_viewed", { userId: dbUser.uid });
    }
  }, [dbUser]);

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
      refreshDashboard();
    } catch (err) {
      console.error("Failed to log activity:", err);
    } finally {
      setLoggingAction(null);
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
  const activityList = activities ?? [];

  // Derived stats (kept in the page only to bridge hooks → components).
  const weeklyChange = getWeeklyScoreChange(activityList);
  const carbonSavedSoFar = score.carbonSaved ?? 0;
  const lastActivity = activityList[0];
  const monthlyReport = buildMonthlyReport(activityList, score.streak ?? 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppNav userName={profile.name} onSignOut={handleSignOut} />

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {/* Dynamic success toast */}
        {logSuccessMsg && (
          <div
            role="status"
            aria-live="polite"
            className="animate-slide-in flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800 shadow-md dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400"
          >
            <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold">{logSuccessMsg}</span>
          </div>
        )}

        {/* Terra Biome — the living-Earth companion */}
        <TerraBiome
          ecoScore={score.ecoScore}
          level={score.level}
          streak={score.streak}
          carbonSaved={carbonSavedSoFar}
          monthlyGoal={DEFAULT_MONTHLY_GOAL_KG}
        />

        {/* Gaia companion — reacts to streak & recent activity (speech bubble) */}
        <div className="flex justify-center">
          <EcoCompanion
            streak={score.streak}
            bestStreak={score.bestStreak}
            lastActivityAt={lastActivity?.createdAt ?? null}
            ecoScore={score.ecoScore}
            className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-5 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/10"
          />
        </div>

        {/* Monthly report (data-driven, no hardcoded mockup) */}
        <MonthlyReportCard report={monthlyReport} />

        {/* Consequence / stakes gateway */}
        <Link
          href="/impact"
          className="group flex items-center justify-between rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 px-5 py-4 transition-all hover:shadow-md dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-teal-950/10"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Feel the stakes
            </span>
            <p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-200">
              See your year at this pace — trees, flights, and balloons of CO₂
            </p>
          </div>
          <span className="text-emerald-600 transition-transform group-hover:translate-x-0.5 dark:text-emerald-400">
            →
          </span>
        </Link>

        {/* Headline metrics */}
        <MetricCards
          ecoScore={score.ecoScore}
          streak={score.streak}
          weeklyChange={weeklyChange}
          lastActivityType={lastActivity?.type}
        />

        {/* AI reflection + recommendations */}
        <div className="grid gap-6 md:grid-cols-2">
          <WeeklyReflectionCard
            insight={insight}
            isGenerating={isGenerating}
            onGenerate={generateInsights}
            onMarkViewed={markViewed}
          />
          <RecommendationsStrip
            recommendations={recommendations}
            actionLoading={recActionLoading}
            onAccept={acceptRec}
            onDismiss={dismissRec}
          />
        </div>

        {/* Quick log + challenges */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <QuickLogCard loggingAction={loggingAction} onLog={handleQuickLog} />
          </div>
          <div className="md:col-span-1">
            <ChallengesCard challenges={challenges} total={3} />
          </div>
        </div>

        {/* Recent activities */}
        <RecentActivitiesList
          activities={activityList}
          hasMore={hasMoreActivities}
          loadingMore={loadingMore}
          onLoadMore={loadMoreActivities}
        />
      </main>

      {/* PWA banner */}
      <InstallAppBanner />
    </div>
  );
}
