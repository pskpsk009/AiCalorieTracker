import { bangkokDayKey, getBangkokWeek } from "../date-range";
import type { MealRecord } from "../meals";
import type { WalkingRecord } from "../walking";
import { summarizeWeek, weeklyInsights, type WeekSummaryInput } from "../weekly-summary";

// Wednesday 2026-10-14 in Bangkok: Mon–Wed have happened, Thu–Sun are in the future.
const week = getBangkokWeek(0, new Date("2026-10-14T05:00:00Z"));
const [mon, tue, wed, thu] = week.days;

let nextId = 0;
function meal(
  eatenAt: string,
  calories: number,
  macros = { protein: 0, carbs: 0, fat: 0 },
): MealRecord {
  return { id: `meal-${nextId++}`, eatenAt, day: bangkokDayKey(eatenAt), calories, ...macros };
}
function walk(completedAt: string, durationSeconds: number, caloriesBurned: number): WalkingRecord {
  return {
    id: `walk-${nextId++}`,
    userId: "user",
    createdAt: completedAt,
    completedAt,
    day: bangkokDayKey(completedAt),
    durationSeconds,
    caloriesBurned,
  };
}
const input = (overrides: Partial<WeekSummaryInput> = {}): WeekSummaryInput => ({
  week,
  meals: [],
  walking: [],
  confirmedDays: [],
  ...overrides,
});

describe("summarizeWeek: nutrition", () => {
  it("totals calories and macros, and daily totals add up to the weekly ones", () => {
    const summary = summarizeWeek(
      input({
        meals: [
          meal("2026-10-12T01:00:00Z", 500, { protein: 30, carbs: 50, fat: 10 }),
          meal("2026-10-12T11:00:00Z", 700, { protein: 40, carbs: 60, fat: 25 }),
          meal("2026-10-14T03:00:00Z", 450, { protein: 20, carbs: 55, fat: 12 }),
        ],
      }),
    );
    expect(summary.nutrition).toMatchObject({
      totalCalories: 1650,
      protein: 90,
      carbs: 165,
      fat: 47,
      mealCount: 3,
      daysWithMeals: 2,
    });
    expect(summary.days.map((day) => day.calories)).toEqual([1200, 0, 450, 0, 0, 0, 0]);
    const dailySum = summary.days.reduce((total, day) => total + day.calories, 0);
    expect(dailySum).toBe(summary.nutrition.totalCalories);
  });

  it("puts a meal eaten at 23:30 Bangkok time on that day, not the next", () => {
    const summary = summarizeWeek(input({ meals: [meal("2026-10-12T16:30:00Z", 300)] }));
    expect(summary.days[0]).toMatchObject({ day: mon, calories: 300 });
    expect(summary.days[1].calories).toBe(0);
  });

  it("counts a meal only once even if it appears twice", () => {
    const duplicated = meal("2026-10-13T05:00:00Z", 600);
    const summary = summarizeWeek(input({ meals: [duplicated, { ...duplicated }] }));
    expect(summary.nutrition.totalCalories).toBe(600);
    expect(summary.nutrition.mealCount).toBe(1);
  });

  it("ignores meals outside the week", () => {
    const summary = summarizeWeek(
      input({ meals: [meal("2026-10-11T16:59:00Z", 999), meal("2026-10-18T17:00:00Z", 999)] }),
    );
    expect(summary.nutrition.totalCalories).toBe(0);
  });
});

describe("summarizeWeek: day status and missing data", () => {
  it("tells not-logged, partial, confirmed-zero and future days apart", () => {
    const summary = summarizeWeek(
      input({
        meals: [meal("2026-10-12T05:00:00Z", 1800), meal("2026-10-14T05:00:00Z", 900)],
        confirmedDays: [mon, tue],
      }),
    );
    expect(summary.days.map((day) => [day.day, day.status, day.calories])).toEqual([
      [mon, "complete", 1800],
      [tue, "complete", 0], // confirmed: genuinely ate nothing logged-worthy
      [wed, "partial", 900],
      [thu, "future", 0],
      [week.days[4], "future", 0],
      [week.days[5], "future", 0],
      [week.days[6], "future", 0],
    ]);
    expect(summary.elapsedDays).toBe(3);
  });

  it("averages intake over complete days only, including a confirmed zero day", () => {
    const summary = summarizeWeek(
      input({
        meals: [meal("2026-10-12T05:00:00Z", 2000), meal("2026-10-14T05:00:00Z", 5000)],
        confirmedDays: [mon, tue],
      }),
    );
    expect(summary.nutrition.completeDays).toBe(2);
    expect(summary.nutrition.averageDailyCalories).toBe(1000); // (2000 + 0) / 2; Wed is partial
  });

  it("has no average when no day is complete", () => {
    const summary = summarizeWeek(input({ meals: [meal("2026-10-12T05:00:00Z", 2000)] }));
    expect(summary.nutrition.averageDailyCalories).toBeNull();
  });

  it("ignores a confirmation for a future day", () => {
    const summary = summarizeWeek(input({ confirmedDays: [thu] }));
    expect(summary.days[3].status).toBe("future");
    expect(summary.nutrition.completeDays).toBe(0);
  });

  it("returns zeros, not invented values, for an empty week", () => {
    const summary = summarizeWeek(input());
    expect(summary.nutrition.totalCalories).toBe(0);
    expect(summary.walking.sessions).toBe(0);
    expect(summary.walking.averageSecondsPerSession).toBeNull();
    expect(summary.days.slice(0, 3).every((day) => day.status === "not-logged")).toBe(true);
  });
});

describe("summarizeWeek: walking", () => {
  it("totals sessions, time and stored calorie estimates per day and per week", () => {
    const summary = summarizeWeek(
      input({
        walking: [
          walk("2026-10-12T00:30:00Z", 1200, 100),
          walk("2026-10-12T12:00:00Z", 600, 50),
          walk("2026-10-14T01:00:00Z", 1800, 150),
        ],
      }),
    );
    expect(summary.walking).toMatchObject({
      sessions: 3,
      totalSeconds: 3600,
      estimatedCalories: 300,
      daysWithWalking: 2,
      averageSecondsPerDay: 1200, // 3600 s over 3 elapsed days
      averageSecondsPerSession: 1200,
    });
    expect(summary.days.map((day) => day.walkingSeconds)).toEqual([1800, 0, 1800, 0, 0, 0, 0]);
    const dailyKcal = summary.days.reduce((total, day) => total + day.walkingCalories, 0);
    expect(dailyKcal).toBe(summary.walking.estimatedCalories);
  });

  it("counts a session only once even if it appears twice", () => {
    const session = walk("2026-10-13T05:00:00Z", 900, 75);
    const summary = summarizeWeek(input({ walking: [session, session] }));
    expect(summary.walking.sessions).toBe(1);
    expect(summary.walking.estimatedCalories).toBe(75);
  });
});

describe("partial energy figure", () => {
  it("is logged food minus estimated walking calories, nothing more", () => {
    const summary = summarizeWeek(
      input({
        meals: [meal("2026-10-12T05:00:00Z", 2000)],
        walking: [walk("2026-10-12T06:00:00Z", 1800, 150)],
      }),
    );
    expect(summary.foodMinusWalking).toBe(1850);
  });
});

describe("weeklyInsights", () => {
  it("describes recorded data and flags incomplete tracking", () => {
    const summary = summarizeWeek(
      input({
        meals: [meal("2026-10-12T05:00:00Z", 2000), meal("2026-10-14T05:00:00Z", 900)],
        walking: [walk("2026-10-12T06:00:00Z", 1200, 100), walk("2026-10-13T06:00:00Z", 1320, 110)],
        confirmedDays: [mon],
      }),
    );
    expect(weeklyInsights(summary)).toEqual([
      "This week is in progress: day 3 of 7.",
      "You logged 2 meals on 2 of 3 days.",
      "1 day with meals isn't marked complete, so intake may be undercounted.",
      "Average intake on your 1 complete day: 2,000 kcal.",
      "You recorded 2 walking sessions this week.",
      "Your average recorded walk lasted 21 minutes.",
    ]);
  });

  it("says so when nothing was recorded", () => {
    const pastWeek = getBangkokWeek(-1, new Date("2026-10-14T05:00:00Z"));
    expect(weeklyInsights(summarizeWeek(input({ week: pastWeek })))).toEqual([
      "No meals logged this week.",
      "No walks recorded this week.",
    ]);
    expect(weeklyInsights(summarizeWeek(input()))).toContain("No walks recorded this week yet.");
  });
});
