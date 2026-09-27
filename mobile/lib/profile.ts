import { supabase } from "./supabase";

export type ProfileData = {
  name: string | null;
  weightKg: number | null;
  heightCm: number | null;
};

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
    weightKg: data?.weight_kg ?? null,
    heightCm: data?.height_cm ?? null,
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
