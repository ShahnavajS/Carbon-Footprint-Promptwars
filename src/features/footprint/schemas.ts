import { z } from "zod";
import type { CarbonCategory } from "@/types";

export const CarbonLogSchema = z.object({
  category: z.enum(["transportation", "food", "energy", "shopping", "waste"] satisfies [
    CarbonCategory,
    ...CarbonCategory[],
  ]),
  amount: z.number().positive("Amount must be a positive number"),
  unit: z.string().min(1, "Unit is required"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export type CarbonLogInput = z.infer<typeof CarbonLogSchema>;

export const CATEGORY_LABELS: Record<CarbonCategory, string> = {
  transportation: "Transportation",
  food: "Food & Diet",
  energy: "Home Energy",
  shopping: "Shopping",
  waste: "Waste",
};

export const CATEGORY_EMISSION_FACTORS: Record<CarbonCategory, Record<string, number>> = {
  transportation: {
    km_car_petrol: 0.192,
    km_car_diesel: 0.171,
    km_bus: 0.089,
    km_train: 0.041,
    km_flight: 0.255,
  },
  food: {
    kg_beef: 27.0,
    kg_chicken: 6.9,
    kg_vegetables: 2.0,
    meal_vegan: 0.5,
    meal_meat: 3.5,
  },
  energy: {
    kwh_electricity: 0.233,
    kwh_gas: 0.203,
    liter_oil: 2.52,
  },
  shopping: {
    usd_clothing: 0.025,
    usd_electronics: 0.04,
    item_tshirt: 10.0,
    item_laptop: 300.0,
  },
  waste: {
    kg_landfill: 0.57,
    kg_recycled: 0.02,
    kg_composted: 0.01,
  },
};
