import type { Meal } from "./app-state";
import { getBangkokDayBounds, type DayKey } from "./date-range";
import { getMealsWithItemsInRange } from "./meals";
import { supabase } from "./supabase";
import { getWalkingRecordsInRange, type WalkingRecord } from "./walking";

export type DayDetails = { meals: Meal[]; walks: WalkingRecord[] };

/** Everything logged on one Bangkok day: meals with their items, and completed walks. */
export async function getDayDetails(day: DayKey): Promise<DayDetails> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Please sign in to see this day.");

  const range = getBangkokDayBounds(day);
  const [meals, walks] = await Promise.all([
    getMealsWithItemsInRange(userData.user.id, range),
    getWalkingRecordsInRange(userData.user.id, range),
  ]);
  // Oldest first reads naturally as a timeline of the day.
  return { meals: meals.reverse(), walks };
}
