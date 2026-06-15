export interface UserProfileData {
  name: string;
  email: string | null;
  avatar: string | null;
  city: string;
  country: string;
  language: string;
}

export type DietType = "vegan" | "vegetarian" | "mixed" | "high-meat";
export type TransportType = "walk" | "bicycle" | "metro" | "bus" | "car" | "mixed";
export type HomeType = "shared" | "apartment" | "house";

export interface UserPreferences {
  dietType: DietType;
  transportType: TransportType;
  homeType: HomeType;
}

export interface UserGoals {
  reduceTransport: boolean;
  reduceFood: boolean;
  reduceEnergy: boolean;
  buildHabits: boolean;
  learnSustainability: boolean;
}

export interface UserScore {
  ecoScore: number;
  level: number;
  streak: number;
  bestStreak?: number;
  lastActivityAt?: number;
  carbonSaved?: number;
  goalDifficulty?: "easy" | "medium" | "hard";
}

export interface UserMetadata {
  createdAt: number;
  updatedAt: number;
}

export interface EcoScoreUser {
  uid: string;
  profile: UserProfileData;
  sustainability: UserPreferences;
  goals: UserGoals;
  score: UserScore;
  metadata: UserMetadata;
}
