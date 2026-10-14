import { supabase } from "./supabase";

export type ProfileData = {
  name: string | null;
  weightKg: number | null;
  heightCm: number | null;
};

// Postgres numeric can arrive as a string; anything not a positive number counts as missing.
export function positiveNumberOrNull(value: unknown): number | null {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) && number > 0 ? number : null;
}

/** BMI = kg / m². Returns null unless both values are finite and positive. */
export function calculateBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (weightKg === null || heightCm === null) return null;
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm)) return null;
  if (weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function bmiCategory(bmi: number) {
  if (bmi < 18.5) return "Below typical range";
  if (bmi < 25) return "Typical range";
  if (bmi < 30) return "Above typical range";
  return "High range";
}

export async function getProfile(): Promise<ProfileData> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Please sign in before loading your profile.");

  const { data, error } = await supabase
    .from("profiles")
    .select("name, weight_kg, height_cm")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (error) throw error;

  return {
    name: data?.name ?? null,
    weightKg: positiveNumberOrNull(data?.weight_kg),
    heightCm: positiveNumberOrNull(data?.height_cm),
  };
}

export async function saveProfileMeasurements(weightKg: number, heightCm: number) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Please sign in before saving your measurements.");

  const { error } = await supabase
    .from("profiles")
    .update({ weight_kg: weightKg, height_cm: heightCm })
    .eq("id", userData.user.id);
  if (error) throw error;
}
