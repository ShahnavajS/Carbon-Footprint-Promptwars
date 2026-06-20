"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@/hooks/use-auth";
import { useJournal } from "@/hooks/use-journal";
import { AppNav } from "@/components/layout/app-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookHeart, Send } from "lucide-react";
import type { JournalMood } from "@/repositories/journal.repository";

const MOODS: { value: JournalMood; emoji: string; label: string }[] = [
  { value: "proud", emoji: "🌟", label: "Proud" },
  { value: "inspired", emoji: "✨", label: "Inspired" },
  { value: "hopeful", emoji: "🌱", label: "Hopeful" },
  { value: "neutral", emoji: "😐", label: "Okay" },
  { value: "struggling", emoji: "🌧️", label: "Struggling" },
];

const MOOD_LABEL: Record<JournalMood, string> = {
  proud: "Proud",
  inspired: "Inspired",
  hopeful: "Hopeful",
  neutral: "Okay",
  struggling: "Struggling",
};

export default function JournalPage() {
  const router = useRouter();
  const { dbUser, signOut } = useAuthActions();
  const { entries, addEntry, isSaving, error } = useJournal();
  const [mood, setMood] = React.useState<JournalMood>("hopeful");
  const [note, setNote] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addEntry(mood, note);
      setNote("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // error surfaced via hook
    }
  };

  if (!dbUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800 dark:border-t-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppNav userName={dbUser.profile.name} onSignOut={handleSignOut} />

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400">
            <BookHeart className="h-3.5 w-3.5" aria-hidden="true" />
            Reflection Journal
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            How does caring for the planet feel today?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Climate action is emotional. This is a quiet space to check in with yourself — your
            hopes, your pride, even your worry. No scores here, just you.
          </p>
        </div>

        {/* Composer */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  How are you feeling?
                </legend>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Mood">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      role="radio"
                      aria-checked={mood === m.value}
                      onClick={() => setMood(m.value)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                        mood === m.value
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
                      }`}
                    >
                      <span aria-hidden="true">{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="journal-note" className="sr-only">
                  Your reflection
                </label>
                <textarea
                  id="journal-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="A few words about your climate feelings, a win, a worry, a hope..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{note.length}/500</span>
                  {error && <span className="text-[10px] font-bold text-red-500">{error}</span>}
                  {success && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Saved 🌿
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSaving || !note.trim()}
                isLoading={isSaving}
                className="w-full"
              >
                <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Save reflection
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Past reflections */}
        {entries.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Your reflections
            </h2>
            {entries.map((entry) => (
              <Card key={entry.id} className="rounded-xl">
                <CardContent className="p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {MOOD_LABEL[entry.mood]}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {entry.note}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
