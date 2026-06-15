import * as React from "react";
import { cn } from "@/lib/utils";

export function Spinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="loading"
      className={cn(
        "h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600 dark:border-slate-700 dark:border-t-emerald-500",
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-800", className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 p-6 space-y-4 dark:border-slate-800">
      <Skeleton className="h-5 w-2/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="pt-2 flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center space-y-4">
      <Spinner className="h-10 w-10 border-4" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Loading EcoScore dashboard...
      </p>
    </div>
  );
}
