"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { useRouter } from "next/navigation";

export function FootprintEmptyState() {
  const router = useRouter();

  return (
    <EmptyState
      title="No carbon logs yet"
      description="Start tracking your daily activities to see your carbon footprint score and personalised AI insights."
      actionText="Log Your First Activity"
      onActionClick={() => router.push("/log")}
    />
  );
}
