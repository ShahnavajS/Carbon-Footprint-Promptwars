import { z } from "zod";
import type { ActivityCategory } from "./types";

export const ActivityLogSchema = z
  .object({
    category: z.enum(["food", "transport", "energy"] satisfies [
      ActivityCategory,
      ...ActivityCategory[],
    ]),
    actionType: z.string().min(1, "Action type is required"),
  })
  .refine(
    (data) => {
      const { category, actionType } = data;
      if (category === "food") {
        return ["Vegetarian Meal", "Vegan Meal", "Home Cooked Meal"].includes(actionType);
      }
      if (category === "transport") {
        return ["Walked", "Bicycle", "Metro", "Bus"].includes(actionType);
      }
      if (category === "energy") {
        return ["Reduced AC Usage", "Switched Off Appliances", "Line Dried Clothes"].includes(
          actionType
        );
      }
      return false;
    },
    {
      message: "Action type does not match selected category",
      path: ["actionType"],
    }
  );

export type ActivityLogInput = z.infer<typeof ActivityLogSchema>;
