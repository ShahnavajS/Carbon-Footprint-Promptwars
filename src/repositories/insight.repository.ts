import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { AiInsight } from "@/domain/insight/types";

export interface IInsightRepository {
  getLatestInsight(userId: string): Promise<AiInsight | null>;
  getAllInsights(userId: string, pageSize?: number): Promise<AiInsight[]>;
  saveInsight(insight: Omit<AiInsight, "id">): Promise<AiInsight>;
  markInsightViewed(insightId: string): Promise<void>;
  listenToLatestInsight(userId: string, callback: (insight: AiInsight | null) => void): () => void;
}

function docToInsight(id: string, data: Record<string, unknown>): AiInsight {
  return {
    id,
    userId: data.userId as string,
    weekStart:
      data.weekStart instanceof Timestamp ? data.weekStart.toMillis() : (data.weekStart as number),
    title: data.title as string,
    summary: data.summary as string,
    biggestWin: data.biggestWin as string,
    improvementArea: data.improvementArea as string,
    nextStep: data.nextStep as string,
    recommendations: (data.recommendations as AiInsight["recommendations"]) ?? [],
    generatedAt:
      data.generatedAt instanceof Timestamp
        ? data.generatedAt.toMillis()
        : (data.generatedAt as number),
    viewed: (data.viewed as boolean) ?? false,
  };
}

export const InsightRepository: IInsightRepository = {
  async getLatestInsight(userId: string): Promise<AiInsight | null> {
    const collRef = collection(db, "insights");
    const q = query(
      collRef,
      where("userId", "==", userId),
      orderBy("generatedAt", "desc"),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return docToInsight(d.id, d.data() as Record<string, unknown>);
  },

  async getAllInsights(userId: string, pageSize = 10): Promise<AiInsight[]> {
    const collRef = collection(db, "insights");
    const q = query(
      collRef,
      where("userId", "==", userId),
      orderBy("generatedAt", "desc"),
      limit(pageSize)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToInsight(d.id, d.data() as Record<string, unknown>));
  },

  async saveInsight(insight: Omit<AiInsight, "id">): Promise<AiInsight> {
    const collRef = collection(db, "insights");
    const ref = await addDoc(collRef, {
      ...insight,
      generatedAt: serverTimestamp(),
    });
    return { id: ref.id, ...insight };
  },

  async markInsightViewed(insightId: string): Promise<void> {
    const docRef = doc(db, "insights", insightId);
    await updateDoc(docRef, { viewed: true });
  },

  listenToLatestInsight(userId: string, callback: (insight: AiInsight | null) => void): () => void {
    const collRef = collection(db, "insights");
    const q = query(
      collRef,
      where("userId", "==", userId),
      orderBy("generatedAt", "desc"),
      limit(1)
    );
    return onSnapshot(q, (snap) => {
      if (snap.empty) {
        callback(null);
        return;
      }
      const d = snap.docs[0];
      callback(docToInsight(d.id, d.data() as Record<string, unknown>));
    });
  },
};

export default InsightRepository;
