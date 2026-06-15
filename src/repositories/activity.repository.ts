import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { EcoActivity } from "@/domain/activity/types";

export interface IActivityRepository {
  logActivity(activity: Omit<EcoActivity, "id">): Promise<EcoActivity>;
  getRecentActivities(userId: string, count: number): Promise<EcoActivity[]>;
  getActivities(userId: string, startAt: number, endAt: number): Promise<EcoActivity[]>;
  getActivitiesPaged(
    userId: string,
    filters: {
      category?: string;
      pageSize: number;
      lastDoc?: QueryDocumentSnapshot<DocumentData, DocumentData>;
    }
  ): Promise<{
    activities: EcoActivity[];
    lastVisible?: QueryDocumentSnapshot<DocumentData, DocumentData>;
  }>;
  listenToActivities(userId: string, callback: (activities: EcoActivity[]) => void): () => void;
}

export const ActivityRepository: IActivityRepository = {
  async logActivity(activity: Omit<EcoActivity, "id">): Promise<EcoActivity> {
    const collRef = collection(db, "activities");
    const docRef = doc(collRef);
    const newActivity: EcoActivity = {
      id: docRef.id,
      ...activity,
    };

    // Persist to Firestore without the client-side `id` field
    await setDoc(docRef, activity);
    return newActivity;
  },

  async getRecentActivities(userId: string, count: number): Promise<EcoActivity[]> {
    const collRef = collection(db, "activities");
    const q = query(
      collRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(count)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EcoActivity);
  },

  async getActivities(userId: string, startAt: number, endAt: number): Promise<EcoActivity[]> {
    const recentActivities = await this.getRecentActivities(userId, 1000);
    return recentActivities.filter(
      (activity) => activity.createdAt >= startAt && activity.createdAt <= endAt
    );
  },

  async getActivitiesPaged(
    userId: string,
    filters: {
      category?: string;
      pageSize: number;
      lastDoc?: QueryDocumentSnapshot<DocumentData, DocumentData>;
    }
  ): Promise<{
    activities: EcoActivity[];
    lastVisible?: QueryDocumentSnapshot<DocumentData, DocumentData>;
  }> {
    const collRef = collection(db, "activities");

    const constraints: QueryConstraint[] = [
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(filters.pageSize),
    ];

    if (filters.category) {
      constraints.unshift(where("category", "==", filters.category));
    }

    if (filters.lastDoc) {
      constraints.push(startAfter(filters.lastDoc));
    }

    const q = query(collRef, ...constraints);
    const snap = await getDocs(q);

    const activities = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EcoActivity);
    const lastVisible = snap.docs[snap.docs.length - 1];

    return {
      activities,
      lastVisible,
    };
  },

  listenToActivities(userId: string, callback: (activities: EcoActivity[]) => void): () => void {
    const collRef = collection(db, "activities");
    const q = query(collRef, where("userId", "==", userId), orderBy("createdAt", "desc"));

    return onSnapshot(q, (snap) => {
      const activities = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EcoActivity);
      callback(activities);
    });
  },
};

export const activityRepository = ActivityRepository;
export default ActivityRepository;
