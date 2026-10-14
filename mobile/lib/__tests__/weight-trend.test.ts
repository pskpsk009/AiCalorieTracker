import { summarizeWeightHistory } from "../weight-trend";

describe("summarizeWeightHistory", () => {
  it("has no change with no or one measurement", () => {
    expect(summarizeWeightHistory([])).toEqual({
      entries: [],
      first: null,
      latest: null,
      changeKg: null,
    });
    const single = summarizeWeightHistory([{ day: "2026-10-01", weightKg: 70 }]);
    expect(single.latest).toEqual({ day: "2026-10-01", weightKg: 70 });
    expect(single.changeKg).toBeNull();
  });

  it("sorts by day and reports latest minus first", () => {
    const trend = summarizeWeightHistory([
      { day: "2026-10-14", weightKg: 69.4 },
      { day: "2026-10-01", weightKg: 70.6 },
      { day: "2026-10-07", weightKg: 70.1 },
    ]);
    expect(trend.entries.map((entry) => entry.day)).toEqual([
      "2026-10-01",
      "2026-10-07",
      "2026-10-14",
    ]);
    expect(trend.first?.weightKg).toBe(70.6);
    expect(trend.latest?.weightKg).toBe(69.4);
    expect(trend.changeKg).toBe(-1.2); // rounded, no float noise
  });

  it("keeps one entry per day and drops invalid weights", () => {
    const trend = summarizeWeightHistory([
      { day: "2026-10-01", weightKg: 70 },
      { day: "2026-10-01", weightKg: 71 },
      { day: "2026-10-02", weightKg: 0 },
      { day: "2026-10-03", weightKg: Number.NaN },
      { day: "2026-10-04", weightKg: -5 },
    ]);
    expect(trend.entries).toEqual([{ day: "2026-10-01", weightKg: 71 }]);
    expect(trend.changeKg).toBeNull();
  });
});
