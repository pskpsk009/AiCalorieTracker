import { supabase } from "./supabase";
import { getThailandTodayBounds } from "./date-range";

export type SaveWalkingSessionInput = {
  durationSeconds: number;
  caloriesBurned: number;
  startedAt?: string;
  completedAt?: string;
};

export type WalkingSession = SaveWalkingSessionInput & {
  id: string;
  userId: string;
  createdAt: string;
};

export async function saveWalkingSession(input: SaveWalkingSessionInput) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Please sign in before saving a walking session.");

  const { data, error } = await supabase
    .from("walking_sessions")
    .insert({
      user_id: userData.user.id,
      duration_seconds: input.durationSeconds,
      calories_burned: input.caloriesBurned,
      started_at: input.startedAt ?? null,
      completed_at: input.completedAt ?? new Date().toISOString(),
    })
    .select("id, user_id, duration_seconds, calories_burned, started_at, completed_at, created_at")
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    durationSeconds: data.duration_seconds,
    caloriesBurned: data.calories_burned,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    createdAt: data.created_at,
  } satisfies WalkingSession;
}

export async function getWalkingSessions(): Promise<WalkingSession[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Please sign in before loading walking sessions.");
  const { start, end } = getThailandTodayBounds();

  const { data, error } = await supabase
    .from("walking_sessions")
    .select("id, user_id, duration_seconds, calories_burned, started_at, completed_at, created_at")
    .eq("user_id", userData.user.id)
    .gte("completed_at", start)
    .lt("completed_at", end)
    .order("completed_at", { ascending: false });

  if (error) throw error;

  return data.map((session) => ({
    id: session.id,
    userId: session.user_id,
    durationSeconds: session.duration_seconds,
    caloriesBurned: session.calories_burned,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    createdAt: session.created_at,
  }));
}
