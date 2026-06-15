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
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { AiRecommendation } from "@/domain/insight/types";

export interface IRecommendationRepository {
  getActiveRecommendations(userId: string): Promise<AiRecommendation[]>;
  getAllRecommendations(userId: string, pageSize?: number): Promise<AiRecommendation[]>;
  saveRecommendations(recs: Omit<AiRecommendation, "id">[]): Promise<AiRecommendation[]>;
  acceptRecommendation(recId: string): Promise<void>;
  dismissRecommendation(recId: string): Promise<void>;
  listenToActiveRecommendations(
    userId: string,
    callback: (recs: AiRecommendation[]) => void
  ): () => void;
}

function docToRec(id: string, data: Record<string, unknown>): AiRecommendation {
  return {
    id,
    userId: data.userId as string,
    category: data.category as AiRecommendation["category"],
    action: data.action as string,
    reason: data.reason as string,
    estimatedCarbonSaved: data.estimatedCarbonSaved as number,
    estimatedPoints: data.estimatedPoints as number,
    accepted: data.accepted as boolean | null,
    acceptedAt: data.acceptedAt as number | undefined,
    generatedAt: data.generatedAt as number,
  };
}

export const RecommendationRepository: IRecommendationRepository = {
  async getActiveRecommendations(userId: string): Promise<AiRecommendation[]> {
    const collRef = collection(db, "recommendations");
    const q = query(
      collRef,
      where("userId", "==", userId),
      where("accepted", "==", null),
      orderBy("generatedAt", "desc"),
      limit(3)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToRec(d.id, d.data() as Record<string, unknown>));
  },

  async getAllRecommendations(userId: string, pageSize = 20): Promise<AiRecommendation[]> {
    const collRef = collection(db, "recommendations");
    const q = query(
      collRef,
      where("userId", "==", userId),
      orderBy("generatedAt", "desc"),
      limit(pageSize)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToRec(d.id, d.data() as Record<string, unknown>));
  },

  async saveRecommendations(recs: Omit<AiRecommendation, "id">[]): Promise<AiRecommendation[]> {
    const collRef = collection(db, "recommendations");
    const saved = await Promise.all(
      recs.map(async (rec) => {
        const ref = await addDoc(collRef, rec);
        return { id: ref.id, ...rec };
      })
    );
    return saved;
  },

  async acceptRecommendation(recId: string): Promise<void> {
    const docRef = doc(db, "recommendations", recId);
    await updateDoc(docRef, { accepted: true, acceptedAt: Date.now() });
  },

  async dismissRecommendation(recId: string): Promise<void> {
    const docRef = doc(db, "recommendations", recId);
    await updateDoc(docRef, { accepted: false });
  },

  listenToActiveRecommendations(
    userId: string,
    callback: (recs: AiRecommendation[]) => void
  ): () => void {
    const collRef = collection(db, "recommendations");
    const q = query(
      collRef,
      where("userId", "==", userId),
      where("accepted", "==", null),
      orderBy("generatedAt", "desc"),
      limit(3)
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => docToRec(d.id, d.data() as Record<string, unknown>)));
    });
  },
};

export default RecommendationRepository;
