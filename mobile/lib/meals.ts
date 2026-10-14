import { supabase } from "./supabase";
import type { Meal, MealItem } from "./app-state";
import { bangkokDayKey, getThailandTodayBounds, type DateRange, type DayKey } from "./date-range";

export type MealItemInput = {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type SaveMealInput = {
  mealType: string;
  name: string;
  imagePath?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: MealItemInput[];
};

/** Stored per-meal totals; enough for weekly aggregation without joining meal_items. */
export type MealRecord = {
  id: string;
  eatenAt: string;
  day: DayKey;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export async function saveMeal(input: SaveMealInput): Promise<{ id: string }> {
  if (input.items.length === 0) throw new Error("No food items were returned by the analysis.");
  const toInteger = (value: unknown, field: string, itemName: string) => {
    const numericValue = typeof value === "string" ? Number(value) : value;
    if (typeof numericValue !== "number" || !Number.isFinite(numericValue)) {
      throw new Error(`Invalid ${field} value for ${itemName}: ${String(value)}`);
    }
    return Math.max(0, Math.round(numericValue));
  };
  const items = input.items.map((item) => ({
    ...item,
    grams: toInteger(item.grams, "grams", item.name),
    calories: toInteger(item.calories, "calories", item.name),
    protein: toInteger(item.protein, "protein", item.name),
    carbs: toInteger(item.carbs, "carbs", item.name),
    fat: toInteger(item.fat, "fat", item.name),
  }));
  const totals = items.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      protein: sum.protein + item.protein,
      carbs: sum.carbs + item.carbs,
      fat: sum.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(`Auth: ${userError.message}`);
  if (!userData.user) throw new Error("Please sign in before saving a meal.");

  const { data: meal, error: mealError } = await supabase
    .from("meals")
    .insert({
      user_id: userData.user.id,
      meal_type: input.mealType,
      name: input.name,
      image_path: input.imagePath ?? null,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
    })
    .select("id")
    .single();

  if (mealError)
    throw new Error(`Meals table: ${mealError.message} (${mealError.code ?? "unknown"})`);

  const { error: itemsError } = await supabase
    .from("meal_items")
    .insert(items.map((item) => ({ ...item, meal_id: meal.id })));

  if (itemsError) {
    await supabase.from("meals").delete().eq("id", meal.id);
    throw new Error(`Meal items table: ${itemsError.message} (${itemsError.code ?? "unknown"})`);
  }

  return meal;
}

export async function getMeals(): Promise<Meal[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Please sign in before loading meals.");
  return getMealsWithItemsInRange(userData.user.id, getThailandTodayBounds());
}

/** Full meals (with their food items) in a range, newest first. */
export async function getMealsWithItemsInRange(userId: string, range: DateRange): Promise<Meal[]> {
  const { data, error } = await supabase
    .from("meals")
    .select(
      "id, meal_type, name, eaten_at, calories, protein, carbs, fat, meal_items(id, name, grams, calories, protein, carbs, fat)",
    )
    .eq("user_id", userId)
    .gte("eaten_at", range.start)
    .lt("eaten_at", range.end)
    .order("eaten_at", { ascending: false });

  if (error) throw error;

  return data.map((meal) => ({
    id: meal.id,
    type: meal.meal_type,
    emoji: "🍽️",
    name: meal.name,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    eatenAt: meal.eaten_at,
    items: (meal.meal_items ?? []) as MealItem[],
  }));
}

export async function getMealRecordsInRange(
  userId: string,
  range: DateRange,
): Promise<MealRecord[]> {
  const { data, error } = await supabase
    .from("meals")
    .select("id, eaten_at, calories, protein, carbs, fat")
    .eq("user_id", userId)
    .gte("eaten_at", range.start)
    .lt("eaten_at", range.end)
    .order("eaten_at", { ascending: true });
  if (error) throw new Error(`Meals table: ${error.message} (${error.code ?? "unknown"})`);

  return data.map((meal) => ({
    id: meal.id,
    eatenAt: meal.eaten_at,
    day: bangkokDayKey(meal.eaten_at),
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
  }));
}

export async function deleteMeal(mealId: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(`Auth: ${userError.message}`);
  if (!userData.user) throw new Error("Please sign in before deleting a meal.");

  const { error } = await supabase.from("meals").delete().eq("id", mealId);
  if (error) throw new Error(`Meals table: ${error.message} (${error.code ?? "unknown"})`);
}
