"use client";

import { useEffect, useState, useCallback } from "react";
import {
  JournalRepository,
  type JournalEntry,
  type JournalMood,
} from "@/repositories/journal.repository";
import { useAuthStore } from "@/features/auth/store";
import { isDemoUid } from "@/config/constants";

/**
 * useJournal — manages the user's reflection journal (bidirectional emotion).
 *
 * Real users persist to Firestore via the repository. Demo users keep an
 * in-memory echo so the journal works without a backend during review.
 */
export function useJournal() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In-memory store for the demo path (no Firestore).
  const [demoEntries, setDemoEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }
    if (isDemoUid(user.uid)) {
      setEntries(demoEntries);
      return;
    }
    const unsubscribe = JournalRepository.listenToEntries(user.uid, setEntries);
    return () => unsubscribe();
  }, [user, demoEntries]);

  const addEntry = useCallback(
    async (mood: JournalMood, note: string) => {
      if (!user) throw new Error("Authentication required to journal.");
      if (!note.trim()) throw new Error("Please write a few words.");
      setError(null);
      setIsSaving(true);
      try {
        if (isDemoUid(user.uid)) {
          const entry: JournalEntry = {
            id: `demo-${Date.now()}`,
            userId: user.uid,
            mood,
            note: note.trim(),
            createdAt: Date.now(),
          };
          setDemoEntries((prev) => [entry, ...prev]);
          return;
        }
        await JournalRepository.addEntry(user.uid, mood, note.trim());
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save reflection.";
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [user]
  );

  return { entries, addEntry, isSaving, error };
}

export default useJournal;
