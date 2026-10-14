import { useCallback, useEffect, useState } from "react";
import { getWeightHistory } from "./weight-history";
import { summarizeWeightHistory, type WeightTrend } from "./weight-trend";

/** Loads the weight history once, when `enabled` first becomes true. */
export function useWeightHistory(enabled = true) {
  const [trend, setTrend] = useState<WeightTrend | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setTrend(summarizeWeightHistory(await getWeightHistory()));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load weight history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && !trend && !loading && !error) void load();
  }, [enabled]);

  return { trend, loading, error, reload: load };
}
