import { supabase } from "./supabase";
import { dayKey, getTodayBounds, type DateRange, type DayKey } from "./date-range";
import { getAppTimeZone } from "./timezone";

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

/** A completed session, tagged with the local day it finished on. */
export type WalkingRecord = WalkingSession & { completedAt: string; day: DayKey };

const WALKING_KCAL_PER_MINUTE = 5;

/** Rough estimate used everywhere burned calories are shown: a flat 5 kcal per minute walked. */
export function estimateWalkingCalories(durationSeconds: number) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;
  return Math.max(1, Math.round((durationSeconds / 60) * WALKING_KCAL_PER_MINUTE));
}

const sessionColumns =
  "id, user_id, duration_seconds, calories_burned, started_at, completed_at, created_at";

type SessionRow = {
  id: string;
  user_id: string;
  duration_seconds: number;
  calories_burned: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

function toSession(row: SessionRow): WalkingSession {
  return {
    id: row.id,
    userId: row.user_id,
    durationSeconds: row.duration_seconds,
    caloriesBurned: row.calories_burned,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
  };
}

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
    .select(sessionColumns)
    .single();

  if (error) throw error;

  return toSession(data);
}

export async function getWalkingSessions(): Promise<WalkingSession[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Please sign in before loading walking sessions.");
  const records = await getWalkingRecordsInRange(userData.user.id, getTodayBounds());
  return records.reverse();
}

/** Completed sessions only: unfinished rows have no completed_at and are excluded. */
export async function getWalkingRecordsInRange(
  userId: string,
  range: DateRange,
  timeZone = getAppTimeZone(),
): Promise<WalkingRecord[]> {
  const { data, error } = await supabase
    .from("walking_sessions")
    .select(sessionColumns)
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", range.start)
    .lt("completed_at", range.end)
    .order("completed_at", { ascending: true });

  if (error) throw error;

  return data.map((row) => ({
    ...toSession(row),
    completedAt: row.completed_at!,
    day: dayKey(row.completed_at!, timeZone),
  }));
}
