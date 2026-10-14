import { useCallback, useEffect, useRef, useState } from "react";
import type { DayKey } from "./date-range";
import { setDayConfirmed } from "./day-confirmations";
import { useAppState } from "./app-state";
import { getWeekSummary } from "./weekly";
import type { WeekSummary } from "./weekly-summary";

/** Loads a week's summary, caching each week so switching tabs or weeks doesn't refetch. */
export function useWeekSummary(weekOffset: number, enabled = true) {
  const { timeZone } = useAppState();
  const cache = useRef(new Map<string, WeekSummary>());
  const latestRequest = useRef(0);
  const [summary, setSummary] = useState<WeekSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      const request = ++latestRequest.current;
      const key = `${timeZone}:${weekOffset}`;
      const cached = cache.current.get(key);
      setSummary(cached ?? null);
      setError(null);
      if (cached && !force) return;
      setLoading(true);
      try {
        const next = await getWeekSummary(weekOffset, timeZone);
        cache.current.set(key, next);
        // Ignore responses for a week the user has already navigated away from.
        if (request === latestRequest.current) setSummary(next);
      } catch (loadError) {
        if (request === latestRequest.current)
          setError(loadError instanceof Error ? loadError.message : "Could not load this week.");
      } finally {
        if (request === latestRequest.current) setLoading(false);
      }
    },
    [weekOffset, timeZone],
  );

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  const setConfirmed = useCallback(
    async (day: DayKey, confirmed: boolean) => {
      await setDayConfirmed(day, confirmed);
      await load(true);
    },
    [load],
  );

  return { summary, loading, error, reload: () => load(true), setConfirmed };
}
