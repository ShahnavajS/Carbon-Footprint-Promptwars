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
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SectionLabel } from "@/components/ui/section-label";
import { InstallAppBanner } from "@/components/ui/install-banner";
import { trackEvent } from "@/services/analytics";
import { TerraBiome } from "./_components/terra-biome";
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
import { getEcoLevel } from "@/domain/eco-score/levels";
import type { ActivityCategory, ActionType } from "@/domain/activity/types";
import { Sparkles, ArrowRight } from "lucide-react";

/**
 * Dashboard — the authenticated hub, laid out as an asymmetric Bento grid.
 *
 * The grid breaks the previous card monoculture: a large hero tile (Terra
 * Biome) anchors varied-size metric tiles, a wide reflection tile, a tall
 * quick-log tile, and a wide activities list. On mobile it collapses to a
 * single column with the hero first.
 *
 * Composed from focused sub-components (./_components); the page only owns
 * auth state, data orchestration, the log handler, and the grid layout.
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

  React.useEffect(() => {
    if (dbUser) trackEvent("dashboard_viewed", { userId: dbUser.uid });
  }, [dbUser]);

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
      if (result.challengeCompleted) msg += " 🎉 Daily Challenge completed!";
      setLogSuccessMsg(msg);
      refreshDashboard();
    } catch (err) {
      console.error("Failed to log activity:", err);
    } finally {
      setLoggingAction(null);
    }
  };

  if (authLoading || dashboardLoading || !dbUser) {
    return <LoadingScreen message="Loading your dashboard" />;
  }

  const { profile, score } = dbUser;
  const activityList = activities ?? [];
  const weeklyChange = getWeeklyScoreChange(activityList);
  const carbonSavedSoFar = score.carbonSaved ?? 0;
  const lastActivity = activityList[0];
  const monthlyReport = buildMonthlyReport(activityList, score.streak ?? 0);
  const level = getEcoLevel(score.ecoScore);

  return (
    <div className="min-h-screen bg-canvas pb-16 text-ink dark:bg-forest-950 dark:text-forest-50">
      <AppNav userName={profile.name} onSignOut={handleSignOut} />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Success toast */}
        {logSuccessMsg && (
          <div
            role="status"
            aria-live="polite"
            className="animate-slide-in mb-6 flex items-center gap-2 rounded-md border border-forest-200 bg-forest-50 p-4 text-sm font-medium text-forest-800 dark:border-forest-800 dark:bg-forest-950/40 dark:text-forest-200"
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{logSuccessMsg}</span>
          </div>
        )}

        {/* ── BENTO GRID ────────────────────────────────────────────── */}
        <div className="grid auto-rows-[minmax(120px,auto)] grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {/* Hero tile — Terra Biome (spans 2 cols × 2 rows on desktop) */}
          <section
            aria-label="Terra Biome"
            className="md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2"
          >
            <TerraBiome
              ecoScore={score.ecoScore}
              level={score.level}
              streak={score.streak}
              carbonSaved={carbonSavedSoFar}
              monthlyGoal={DEFAULT_MONTHLY_GOAL_KG}
            />
          </section>

          {/* Metric tile — EcoScore */}
          <section
            aria-label="EcoScore"
            className="flex flex-col justify-between rounded-lg border border-hairline bg-paper p-5 dark:border-forest-800 dark:bg-forest-900"
          >
            <div className="flex items-center justify-between">
              <SectionLabel>Vitality</SectionLabel>
              <Eyebrow tone="soft">
                {level.emoji} L{level.level}
              </Eyebrow>
            </div>
            <div className="mt-3">
              <span className="font-display text-5xl font-medium tracking-tight text-ink dark:text-paper">
                {score.ecoScore}
              </span>
              <span className="mono-label ml-1.5 text-ink-muted dark:text-forest-200/50">
                / 1000
              </span>
            </div>
            {weeklyChange > 0 ? (
              <p className="mt-2 text-xs font-medium text-forest-600 dark:text-forest-300">
                +{weeklyChange} this week
              </p>
            ) : (
              <p className="mt-2 text-xs text-ink-muted dark:text-forest-200/50">
                No change this week
              </p>
            )}
          </section>

          {/* Metric tile — Streak */}
          <section
            aria-label="Streak"
            className="flex flex-col justify-between rounded-lg border border-hairline bg-paper p-5 dark:border-forest-800 dark:bg-forest-900"
          >
            <SectionLabel>Streak</SectionLabel>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-5xl font-medium tracking-tight text-ink dark:text-paper">
                {score.streak}
              </span>
              <span className="mono-label text-ink-muted dark:text-forest-200/50">DAYS</span>
            </div>
            <p className="mt-2 truncate text-xs text-ink-muted dark:text-forest-200/50">
              {lastActivity ? `Last: ${lastActivity.type}` : "Log to start a streak"}
            </p>
          </section>

          {/* Mascot chip — floating speech, not a full card */}
          <section
            aria-label="Gaia companion"
            className="rounded-lg border border-forest-150 bg-forest-50/50 p-5 dark:border-forest-800 dark:bg-forest-900/60 md:col-span-1"
          >
            <EcoCompanion
              streak={score.streak}
              bestStreak={score.bestStreak}
              lastActivityAt={lastActivity?.createdAt ?? null}
              ecoScore={score.ecoScore}
              compact
            />
          </section>

          {/* Wide tile — Weekly AI Reflection */}
          <section aria-label="Weekly reflection" className="md:col-span-2 lg:col-span-2">
            <WeeklyReflectionCard
              insight={insight}
              isGenerating={isGenerating}
              onGenerate={generateInsights}
              onMarkViewed={markViewed}
            />
          </section>

          {/* Wide tile — Recommendations */}
          <section aria-label="Recommendations" className="md:col-span-2 lg:col-span-2">
            <RecommendationsStrip
              recommendations={recommendations}
              actionLoading={recActionLoading}
              onAccept={acceptRec}
              onDismiss={dismissRec}
            />
          </section>

          {/* Tall tile — Quick Log (spans 2 rows on desktop) */}
          <section aria-label="Quick log" className="md:col-span-2 md:row-span-1 lg:col-span-2">
            <QuickLogCard loggingAction={loggingAction} onLog={handleQuickLog} />
          </section>

          {/* Tile — Challenges */}
          <section aria-label="Challenges" className="md:col-span-1 lg:col-span-2">
            <ChallengesCard challenges={challenges} total={3} />
          </section>

          {/* Wide tile — Recent activities (full width) */}
          <section aria-label="Recent activities" className="md:col-span-3 lg:col-span-4">
            <RecentActivitiesList
              activities={activityList}
              hasMore={hasMoreActivities}
              loadingMore={loadingMore}
              onLoadMore={loadMoreActivities}
            />
          </section>
        </div>

        {/* ── Secondary band: monthly report + impact gateway ── */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <MonthlyReportCard report={monthlyReport} />
          </div>
          <Link
            href="/impact"
            className="group flex flex-col justify-between rounded-lg border border-forest-150 bg-forest-700 p-6 text-paper transition-transform hover:scale-[1.01] dark:border-forest-600 dark:bg-forest-800"
          >
            <SectionLabel onDark>Feel the stakes</SectionLabel>
            <p className="mt-2 font-display text-lg font-medium leading-snug">
              Your year at this pace
            </p>
            <p className="mt-1 text-xs text-forest-100/80">
              Trees, flights, and balloons of CO₂ across three paths.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-forest-100">
              See it{" "}
              <ArrowRight
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>
      </main>

      <InstallAppBanner />
    </div>
  );
}
