import { collection, doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";
import type { DailyChallenge, UserChallengeCompletion } from "@/domain/activity/types";

export const DEFAULT_CHALLENGES: DailyChallenge[] = [
  {
    id: "challenge_transport",
    title: "Take public transport today",
    category: "transport",
    actionType: "Metro", // Also maps to Bus
    pointsReward: 15,
    carbonReward: 1.0,
  },
  {
    id: "challenge_vegetarian",
    title: "Eat one vegetarian meal",
    category: "food",
    actionType: "Vegetarian Meal", // Also maps to Vegan Meal
    pointsReward: 10,
    carbonReward: 0.5,
  },
  {
    id: "challenge_ac",
    title: "Reduce AC usage today",
    category: "energy",
    actionType: "Reduced AC Usage",
    pointsReward: 10,
    carbonReward: 0.5,
  },
];

export interface IChallengeRepository {
  getDailyChallenges(): Promise<DailyChallenge[]>;
  completeChallenge(userId: string, challengeId: string): Promise<void>;
  listenToCompletions(
    userId: string,
    callback: (completions: Record<string, boolean>) => void
  ): () => void;
}

export const ChallengeRepository: IChallengeRepository = {
  async getDailyChallenges(): Promise<DailyChallenge[]> {
    return DEFAULT_CHALLENGES;
  },

  async completeChallenge(userId: string, challengeId: string): Promise<void> {
    const userDocRef = doc(db, "users", userId);
    const challDocRef = doc(collection(userDocRef, "challenges"), challengeId);

    const completion: UserChallengeCompletion = {
      challengeId,
      completed: true,
      completedAt: Date.now(),
    };

    await setDoc(challDocRef, completion);
  },

  listenToCompletions(
    userId: string,
    callback: (completions: Record<string, boolean>) => void
  ): () => void {
    const userDocRef = doc(db, "users", userId);
    const collRef = collection(userDocRef, "challenges");

    return onSnapshot(collRef, (snap) => {
      const completions: Record<string, boolean> = {};
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() as UserChallengeCompletion;
        completions[data.challengeId] = data.completed;
      });
      callback(completions);
    });
  },
};

export default ChallengeRepository;
