import { positiveNumberOrNull } from "./profile";
import { supabase } from "./supabase";
import type { WeightEntry } from "./weight-trend";

/**
 * The most recent dated weight measurements, oldest first. Rows are written by a database
 * trigger whenever the profile weight is saved (see the add_weight_measurements migration).
 */
export async function getWeightHistory(limit = 12): Promise<WeightEntry[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Please sign in to see your weight history.");

  const { data, error } = await supabase
    .from("weight_measurements")
    .select("measured_on, weight_kg")
    .eq("user_id", userData.user.id)
    .order("measured_on", { ascending: false })
    .limit(limit);
  if (error) {
    // Before the migration is applied there is simply no history to show.
    if (/PGRST205|42P01/.test(error.code ?? "")) return [];
    throw new Error(`Weight history: ${error.message} (${error.code ?? "unknown"})`);
  }

  return data
    .map((row) => ({
      day: row.measured_on as string,
      weightKg: positiveNumberOrNull(row.weight_kg),
    }))
    .filter((entry): entry is WeightEntry => entry.weightKg !== null)
    .reverse();
}
