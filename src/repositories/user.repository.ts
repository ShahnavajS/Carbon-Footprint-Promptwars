import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import type { EcoScoreUser } from "@/domain/user/types";

export interface IUserRepository {
  getUser(userId: string): Promise<EcoScoreUser | null>;
  createUser(userId: string, data: Omit<EcoScoreUser, "uid" | "metadata">): Promise<EcoScoreUser>;
  updateUser(userId: string, data: Partial<EcoScoreUser>): Promise<void>;
  saveProfile(userId: string, profile: Partial<EcoScoreUser["profile"]>): Promise<void>;
  saveOnboarding(
    userId: string,
    onboardingData: {
      sustainability: EcoScoreUser["sustainability"];
      goals: EcoScoreUser["goals"];
      score: EcoScoreUser["score"];
      profile: { city: string; country: string };
    }
  ): Promise<void>;
}

export const UserRepository: IUserRepository = {
  async getUser(userId: string): Promise<EcoScoreUser | null> {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { uid: userId, ...docSnap.data() } as EcoScoreUser;
    }
    return null;
  },

  async createUser(
    userId: string,
    data: Omit<EcoScoreUser, "uid" | "metadata">
  ): Promise<EcoScoreUser> {
    const docRef = doc(db, "users", userId);
    const now = Date.now();
    const newUser: EcoScoreUser = {
      uid: userId,
      ...data,
      metadata: {
        createdAt: now,
        updatedAt: now,
      },
    };

    const dbData = {
      profile: data.profile,
      sustainability: data.sustainability,
      goals: data.goals,
      score: data.score,
      metadata: {
        createdAt: now,
        updatedAt: now,
      },
    };
    await setDoc(docRef, dbData);
    return newUser;
  },

  async updateUser(userId: string, data: Partial<EcoScoreUser>): Promise<void> {
    const docRef = doc(db, "users", userId);

    // Flatten metadata update or add target parameters
    const updates: Record<string, unknown> = {
      ...data,
      "metadata.updatedAt": Date.now(),
    };

    // Remove root fields that shouldn't be overwritten directly if they are partial
    delete updates.uid;
    delete updates.metadata;

    await updateDoc(docRef, updates);
  },

  async saveProfile(userId: string, profile: Partial<EcoScoreUser["profile"]>): Promise<void> {
    const docRef = doc(db, "users", userId);
    const updates: Record<string, unknown> = {
      "metadata.updatedAt": Date.now(),
    };

    // Update individual profile fields
    Object.entries(profile).forEach(([key, val]) => {
      updates[`profile.${key}`] = val;
    });

    await updateDoc(docRef, updates);
  },

  async saveOnboarding(
    userId: string,
    onboardingData: {
      sustainability: EcoScoreUser["sustainability"];
      goals: EcoScoreUser["goals"];
      score: EcoScoreUser["score"];
      profile: { city: string; country: string };
    }
  ): Promise<void> {
    const docRef = doc(db, "users", userId);

    // Build nested updates for onboarding choices
    const updates: Record<string, unknown> = {
      sustainability: onboardingData.sustainability,
      goals: onboardingData.goals,
      score: onboardingData.score,
      "profile.city": onboardingData.profile.city,
      "profile.country": onboardingData.profile.country,
      "metadata.updatedAt": Date.now(),
    };

    await updateDoc(docRef, updates);
  },
};

export const userRepository = UserRepository;
export default UserRepository;
