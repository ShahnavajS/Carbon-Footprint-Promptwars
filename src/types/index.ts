export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  lastLoginAt: number;
  totalCarbonSavedKg: number;
  currentStreak: number;
  level: number;
  xp: number;
}

export type CarbonCategory = "transportation" | "food" | "energy" | "shopping" | "waste";

export interface CarbonLog {
  id: string;
  userId: string;
  category: CarbonCategory;
  amount: number; // Raw metric representing consumption (e.g. kWh, km, liters)
  unit: string; // Unit metric (e.g. 'kWh', 'km', 'liters')
  carbonFootprintKg: number; // Computed carbon footprint in kg CO2e
  loggedAt: number;
  notes?: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: CarbonCategory;
  frequency: "daily" | "weekly";
  streakCount: number;
  lastCompletedAt: number | null;
  completedDates: string[]; // ISO Strings: YYYY-MM-DD
  pointsValue: number;
  createdAt: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: CarbonCategory | "gamification";
  unlockedAt: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: CarbonCategory;
  impactScore: "high" | "medium" | "low";
  co2ReductionPotentialKg: number; // Potential monthly saving in kg CO2e
  difficulty: "easy" | "medium" | "hard";
  actionUrl?: string;
}
