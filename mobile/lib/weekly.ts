import { getWeek } from "./date-range";
import { getConfirmedDays } from "./day-confirmations";
import { getMealRecordsInRange } from "./meals";
import { getWalkingRecordsInRange } from "./walking";
import { summarizeWeek, type WeekSummary } from "./weekly-summary";
import { supabase } from "./supabase";

/** Loads and summarizes one local week of the signed-in user's meals, walks and confirmed days. */
export async function getWeekSummary(weekOffset: number, timeZone: string): Promise<WeekSummary> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Please sign in to see your progress.");
  const userId = userData.user.id;

  const week = getWeek(weekOffset, new Date(), timeZone);
  const [meals, walking, confirmedDays] = await Promise.all([
    getMealRecordsInRange(userId, week, timeZone),
    getWalkingRecordsInRange(userId, week, timeZone),
    getConfirmedDays(userId, week.days[0], week.days[6]).catch((error: unknown) => {
      // Before the food_day_confirmations migration is applied, treat every day as unconfirmed.
      if (error instanceof Error && /PGRST205|42P01/.test(error.message)) return [];
      throw error;
    }),
  ]);
  return summarizeWeek({ week, meals, walking, confirmedDays });
}
