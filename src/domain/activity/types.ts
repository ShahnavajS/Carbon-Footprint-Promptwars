export type ActivityCategory = "food" | "transport" | "energy";

export type FoodActionType = "Vegetarian Meal" | "Vegan Meal" | "Home Cooked Meal";
export type TransportActionType = "Walked" | "Bicycle" | "Metro" | "Bus";
export type EnergyActionType =
  | "Reduced AC Usage"
  | "Switched Off Appliances"
  | "Line Dried Clothes";

export type ActionType = FoodActionType | TransportActionType | EnergyActionType;

export interface EcoActivity {
  id: string;
  userId: string;
  category: ActivityCategory;
  actionType: ActionType;
  ecoPoints: number;
  carbonSaved: number; // in kg CO2
  createdAt: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  category: ActivityCategory;
  actionType: ActionType;
  pointsReward: number;
  carbonReward: number;
}

export interface UserChallengeCompletion {
  challengeId: string;
  completed: boolean;
  completedAt: number;
}
