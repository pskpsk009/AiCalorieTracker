// Pure weight-history helpers: describes recorded measurements only, never projects forward.
import type { DayKey } from "./date-range";

export type WeightEntry = { day: DayKey; weightKg: number };

export type WeightTrend = {
  /** Oldest first, one entry per day, invalid values removed. */
  entries: WeightEntry[];
  first: WeightEntry | null;
  latest: WeightEntry | null;
  /** latest − first in kg; null with fewer than two measurements. */
  changeKg: number | null;
};

export function summarizeWeightHistory(entries: WeightEntry[]): WeightTrend {
  const byDay = new Map<DayKey, WeightEntry>();
  for (const entry of entries) {
    if (Number.isFinite(entry.weightKg) && entry.weightKg > 0) byDay.set(entry.day, entry);
  }
  const sorted = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
  const first = sorted[0] ?? null;
  const latest = sorted[sorted.length - 1] ?? null;
  return {
    entries: sorted,
    first,
    latest,
    changeKg:
      sorted.length >= 2 ? Math.round((latest!.weightKg - first!.weightKg) * 100) / 100 : null,
  };
}
