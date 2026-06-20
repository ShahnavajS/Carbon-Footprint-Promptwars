import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";

/**
 * Reflection Journal repository.
 *
 * Stores short, mood-tagged user reflections under users/{uid}/journal so the
 * emotional side of the app becomes bidirectional — users can express how they
 * feel, not only receive AI empathy.
 */

export type JournalMood = "hopeful" | "inspired" | "neutral" | "struggling" | "proud";

export interface JournalEntry {
  id: string;
  userId: string;
  mood: JournalMood;
  note: string;
  createdAt: number;
}

export const JournalRepository = {
  /** Realtime listener for the user's recent reflections (newest first). */
  listenToEntries(userId: string, callback: (entries: JournalEntry[]) => void): () => void {
    if (!db) {
      callback([]);
      return () => {};
    }
    const q = query(
      collection(db, "users", userId, "journal"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    return onSnapshot(
      q,
      (snap) => {
        const entries: JournalEntry[] = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId,
            mood: (data.mood as JournalMood) ?? "neutral",
            note: (data.note as string) ?? "",
            createdAt: (data.createdAt as number) ?? Date.now(),
          };
        });
        callback(entries);
      },
      () => callback([])
    );
  },

  /** Adds a new reflection. Demo users get an in-memory echo only. */
  async addEntry(userId: string, mood: JournalMood, note: string): Promise<void> {
    if (!db) return;
    await addDoc(collection(db, "users", userId, "journal"), {
      mood,
      note,
      createdAt: Date.now(),
      serverTimestamp: serverTimestamp(),
    });
  },
};

export default JournalRepository;
