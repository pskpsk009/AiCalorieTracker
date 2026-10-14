// Pure weekly aggregation: no Supabase access here, so it can be unit-tested directly.
import type { DayKey, WeekRange } from "./date-range";
import type { MealRecord } from "./meals";
import type { WalkingRecord } from "./walking";

/**
 * - `future`: hasn't happened yet.
 * - `not-logged`: no meals and not confirmed; we don't know what was eaten.
 * - `partial`: meals logged but not confirmed complete; intake may be undercounted.
 * - `complete`: user confirmed the log is complete (possibly zero calories).
 */
export type FoodDayStatus = "future" | "not-logged" | "partial" | "complete";

export type DaySummary = {
  day: DayKey;
  status: FoodDayStatus;
  mealCount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  walkingSessions: number;
  walkingSeconds: number;
  /** Estimated, from the stored per-session values. */
  walkingCalories: number;
};

export type WeekSummary = {
  week: WeekRange;
  days: DaySummary[];
  /** Days up to and including today: 7 for past weeks, fewer for the current week. */
  elapsedDays: number;
  nutrition: {
    totalCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealCount: number;
    daysWithMeals: number;
    completeDays: number;
    /** Average over `complete` days only; null when there are none. */
    averageDailyCalories: number | null;
  };
  walking: {
    sessions: number;
    totalSeconds: number;
    estimatedCalories: number;
    daysWithWalking: number;
    /** Over elapsed days, counting days without a walk as zero; null before the week starts. */
    averageSecondsPerDay: number | null;
    averageSecondsPerSession: number | null;
  };
  /**
   * Logged food minus estimated walking calories. A partial figure only: it leaves out resting
   * metabolism, digestion and all other activity, so it is not a calorie deficit or surplus.
   */
  foodMinusWalking: number;
};

export type WeekSummaryInput = {
  week: WeekRange;
  meals: MealRecord[];
  walking: WalkingRecord[];
  confirmedDays: DayKey[];
};

const emptyDay = (day: DayKey, status: FoodDayStatus): DaySummary => ({
  day,
  status,
  mealCount: 0,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  walkingSessions: 0,
  walkingSeconds: 0,
  walkingCalories: 0,
});

function uniqueById<T extends { id: string }>(records: T[]): T[] {
  return [...new Map(records.map((record) => [record.id, record])).values()];
}

export function summarizeWeek({
  week,
  meals,
  walking,
  confirmedDays,
}: WeekSummaryInput): WeekSummary {
  const confirmed = new Set(confirmedDays);
  const isFuture = (day: DayKey) => day > week.today;
  const byDay = new Map(week.days.map((day) => [day, emptyDay(day, "not-logged")]));

  // Records outside the week, or dated in the future, are ignored rather than counted.
  for (const meal of uniqueById(meals)) {
    const day = byDay.get(meal.day);
    if (!day || isFuture(meal.day)) continue;
    day.mealCount += 1;
    day.calories += meal.calories;
    day.protein += meal.protein;
    day.carbs += meal.carbs;
    day.fat += meal.fat;
  }
  for (const session of uniqueById(walking)) {
    const day = byDay.get(session.day);
    if (!day || isFuture(session.day)) continue;
    day.walkingSessions += 1;
    day.walkingSeconds += session.durationSeconds;
    day.walkingCalories += session.caloriesBurned;
  }

  const days = week.days.map((key) => {
    const day = byDay.get(key)!;
    day.status = isFuture(key)
      ? "future"
      : confirmed.has(key)
        ? "complete"
        : day.mealCount > 0
          ? "partial"
          : "not-logged";
    return day;
  });

  const sum = (pick: (day: DaySummary) => number, from = days) =>
    from.reduce((total, day) => total + pick(day), 0);
  const elapsedDays = days.filter((day) => day.status !== "future").length;
  const completeDays = days.filter((day) => day.status === "complete");
  const sessions = sum((day) => day.walkingSessions);
  const totalSeconds = sum((day) => day.walkingSeconds);
  const totalCalories = sum((day) => day.calories);
  const walkingCalories = sum((day) => day.walkingCalories);

  return {
    week,
    days,
    elapsedDays,
    nutrition: {
      totalCalories,
      protein: sum((day) => day.protein),
      carbs: sum((day) => day.carbs),
      fat: sum((day) => day.fat),
      mealCount: sum((day) => day.mealCount),
      daysWithMeals: days.filter((day) => day.mealCount > 0).length,
      completeDays: completeDays.length,
      averageDailyCalories:
        completeDays.length > 0
          ? Math.round(sum((day) => day.calories, completeDays) / completeDays.length)
          : null,
    },
    walking: {
      sessions,
      totalSeconds,
      estimatedCalories: walkingCalories,
      daysWithWalking: days.filter((day) => day.walkingSessions > 0).length,
      averageSecondsPerDay: elapsedDays > 0 ? totalSeconds / elapsedDays : null,
      averageSecondsPerSession: sessions > 0 ? totalSeconds / sessions : null,
    },
    foodMinusWalking: totalCalories - walkingCalories,
  };
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const minutes = (seconds: number) => Math.round(seconds / 60);

/** Plain observations from recorded data only: no diagnoses, no predictions. */
export function weeklyInsights(summary: WeekSummary): string[] {
  const { nutrition, walking, elapsedDays } = summary;
  if (elapsedDays === 0) return ["This week hasn't started yet."];
  const insights: string[] = [];
  const inProgress = elapsedDays < 7;
  const yet = inProgress ? " yet" : "";

  if (inProgress) insights.push(`This week is in progress: day ${elapsedDays} of 7.`);

  if (nutrition.mealCount === 0 && nutrition.completeDays === 0) {
    insights.push(`No meals logged this week${yet}.`);
  } else {
    insights.push(
      `You logged ${plural(nutrition.mealCount, "meal")} on ${nutrition.daysWithMeals} of ${elapsedDays} days.`,
    );
    const unconfirmed = summary.days.filter((day) => day.status === "partial").length;
    if (unconfirmed > 0)
      insights.push(
        `${plural(unconfirmed, "day")} with meals ${unconfirmed === 1 ? "isn't" : "aren't"} marked complete, so intake may be undercounted.`,
      );
    if (nutrition.averageDailyCalories !== null)
      insights.push(
        `Average intake on your ${plural(nutrition.completeDays, "complete day")}: ${nutrition.averageDailyCalories.toLocaleString()} kcal.`,
      );
  }

  if (walking.sessions === 0) {
    insights.push(`No walks recorded this week${yet}.`);
  } else {
    insights.push(`You recorded ${plural(walking.sessions, "walking session")} this week.`);
    insights.push(
      `Your average recorded walk lasted ${plural(minutes(walking.averageSecondsPerSession!), "minute")}.`,
    );
  }

  return insights;
}
