import { useCallback, useEffect, useState } from "react";
import type { DayKey } from "./date-range";
import { getDayDetails, type DayDetails } from "./day-details";

/** Loads a day's meals and walks the first time `enabled` becomes true, then keeps them. */
export function useDayDetails(day: DayKey, enabled: boolean) {
  const [details, setDetails] = useState<DayDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setDetails(await getDayDetails(day));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load this day.");
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    if (enabled && !details && !loading && !error) void load();
  }, [enabled]);

  return { details, loading, error, reload: load };
}
