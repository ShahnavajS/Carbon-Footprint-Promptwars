"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Calendar } from "lucide-react";

export default function LogPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              <span>Log Sustainability Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Logging daily activities (transport, diet, energy consumption) will be fully unlocked
              in Phase 3. Here you will be able to log details to improve your overall EcoScore.
            </p>

            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
              <Calendar className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
              <h4 className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Activity logging locked
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Completing onboarding has generated your baseline. Feature logging is coming soon!
              </p>
            </div>

            <Link href="/dashboard" className="block w-full">
              <Button className="w-full">Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
