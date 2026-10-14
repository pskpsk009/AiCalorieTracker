import { supabase } from "./supabase";
import type { DayKey } from "./date-range";

/** Days (inclusive range) the user has marked as a complete food log. */
export async function getConfirmedDays(
  userId: string,
  from: DayKey,
  to: DayKey,
): Promise<DayKey[]> {
  const { data, error } = await supabase
    .from("food_day_confirmations")
    .select("day")
    .eq("user_id", userId)
    .gte("day", from)
    .lte("day", to);
  if (error)
    throw new Error(`Food day confirmations: ${error.message} (${error.code ?? "unknown"})`);
  return data.map((row) => row.day as DayKey);
}

export async function isDayConfirmed(day: DayKey): Promise<boolean> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Please sign in before loading your food log.");
  const days = await getConfirmedDays(userData.user.id, day, day);
  return days.includes(day);
}

export async function setDayConfirmed(day: DayKey, confirmed: boolean) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Please sign in before updating your food log.");

  const table = supabase.from("food_day_confirmations");
  const { error } = confirmed
    ? await table.upsert(
        { user_id: userData.user.id, day },
        { onConflict: "user_id,day", ignoreDuplicates: true },
      )
    : await table.delete().eq("user_id", userData.user.id).eq("day", day);
  if (error)
    throw new Error(`Food day confirmations: ${error.message} (${error.code ?? "unknown"})`);
}
