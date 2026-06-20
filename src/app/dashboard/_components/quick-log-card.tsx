"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
import { ACTIVITY_REWARDS } from "@/services/activity.service";
import type { ActivityCategory, ActionType } from "@/domain/activity/types";

/**
 * Quick-log card: one-tap logging of the 10 fixed eco actions, grouped by
 * category. The points/CO₂ values come from the single ACTIVITY_REWARDS table
 * (the source of truth) so the UI never drifts from the reward logic.
 */

interface ActionDef {
  type: ActionType;
  category: ActivityCategory;
}

// Built once from the rewards table so labels stay in sync with the backend.
const FOOD_ACTIONS: ActionDef[] = [
  { type: "Vegetarian Meal", category: "food" },
  { type: "Vegan Meal", category: "food" },
  { type: "Home Cooked Meal", category: "food" },
];
const TRANSPORT_ACTIONS: ActionDef[] = [
  { type: "Walked", category: "transport" },
  { type: "Bicycle", category: "transport" },
  { type: "Metro", category: "transport" },
  { type: "Bus", category: "transport" },
];
const ENERGY_ACTIONS: ActionDef[] = [
  { type: "Reduced AC Usage", category: "energy" },
  { type: "Switched Off Appliances", category: "energy" },
  { type: "Line Dried Clothes", category: "energy" },
];

interface QuickLogCardProps {
  /** Currently-logging action type (disables all buttons while one is in-flight). */
  loggingAction: string | null;
  onLog: (category: ActivityCategory, actionType: ActionType) => void;
}

function ActionGroup({
  title,
  actions,
  loggingAction,
  onLog,
  columns,
}: {
  title: string;
  actions: ActionDef[];
  loggingAction: string | null;
  onLog: (category: ActivityCategory, actionType: ActionType) => void;
  columns: string;
}) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-forest-200/60">
        {title}
      </h4>
      <div className={`grid grid-cols-1 gap-2 ${columns}`}>
        {actions.map((action) => {
          const reward = ACTIVITY_REWARDS[action.type];
          return (
            <Button
              key={action.type}
              variant="outline"
              size="sm"
              disabled={loggingAction !== null}
              isLoading={loggingAction === action.type}
              onClick={() => onLog(action.category, action.type)}
              className="flex h-auto flex-col items-center justify-center rounded-xl bg-canvas/50 py-2.5 text-center hover:bg-canvas dark:bg-forest-900/50"
            >
              <span className="text-xs font-bold text-ink dark:text-paper">{action.type}</span>
              <span className="mt-1 text-[10px] font-semibold text-forest-600 dark:text-forest-300">
                +{reward.points} pts • -{reward.carbon}kg
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function QuickLogCard({ loggingAction, onLog }: QuickLogCardProps) {
  return (
    <Card className="rounded-2xl border-hairline/60 bg-white shadow-sm dark:border-forest-800 dark:bg-forest-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Leaf className="h-5 w-5 text-forest-600" aria-hidden="true" />
          <span>Your Daily Care Ritual</span>
        </CardTitle>
        <CardDescription>
          Nurture your Terra Biome and spare the atmosphere by completing small real-world actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ActionGroup
          title="Food & Diet"
          actions={FOOD_ACTIONS}
          loggingAction={loggingAction}
          onLog={onLog}
          columns="sm:grid-cols-3"
        />
        <ActionGroup
          title="Transit & Commute"
          actions={TRANSPORT_ACTIONS}
          loggingAction={loggingAction}
          onLog={onLog}
          columns="sm:grid-cols-4"
        />
        <ActionGroup
          title="Household Energy"
          actions={ENERGY_ACTIONS}
          loggingAction={loggingAction}
          onLog={onLog}
          columns="sm:grid-cols-3"
        />
      </CardContent>
    </Card>
  );
}
