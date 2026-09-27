import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { useAppState } from "./lib/app-state";
import { analyzeMeal } from "./lib/meal-analysis";
import { deleteMeal, getMeals, saveMeal } from "./lib/meals";
import { getProfile, saveProfileMeasurements } from "./lib/profile";
import { getWalkingSessions, saveWalkingSession } from "./lib/walking";
import { supabase } from "./lib/supabase";
import { AddMealScreen } from "./screens/add-meal-screen";
import { AnalysisScreen } from "./screens/analysis-screen";
import { AuthScreen } from "./screens/auth-screen";
import { HomeScreen } from "./screens/home-screen";
import { ProfileScreen } from "./screens/profile-screen";
import { ProgressScreen } from "./screens/progress-screen";

type Screen = "login" | "register" | "home" | "add" | "analysis" | "progress" | "profile";

export function GetFitApp({ initialScreen = "login" }: { initialScreen?: Screen }) {
  const router = useRouter();
  const {
    meals,
    setMeals,
    savedBurned,
    setSavedBurned,
    analyzedItems,
    setAnalyzedItems,
    weightKg,
    setWeightKg,
    heightCm,
    setHeightCm,
  } = useAppState();
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [mealsError, setMealsError] = useState<string | null>(null);
  const [requiredProfile, setRequiredProfile] = useState(false);

  const navigate = (nextScreen: Screen) => {
    setScreen(nextScreen);
    router.push(`/${nextScreen}`);
  };

  const navigateAfterAuth = async () => {
    const profile = await getProfile();
    const needsProfile = profile.weightKg === null || profile.heightCm === null;
    setRequiredProfile(needsProfile);
    navigate(needsProfile ? "profile" : "home");
  };

  const loadMeals = async () => {
    setMealsError(null);
    setMealsLoading(true);
    try {
      const [loadedMeals, walkingSessions] = await Promise.all([getMeals(), getWalkingSessions()]);
      setMeals(loadedMeals);
      setSavedBurned(walkingSessions.reduce((total, session) => total + session.caloriesBurned, 0));
    } catch (error) {
      setMealsError(error instanceof Error ? error.message : "Could not load your meals.");
    } finally {
      setMealsLoading(false);
    }
  };

  useEffect(() => {
    if (screen === "home") void loadMeals();
  }, [screen]);

  useEffect(() => {
    if (screen !== "profile") return;
    void getProfile()
      .then((profile) => {
        setWeightKg(profile.weightKg);
        setHeightCm(profile.heightCm);
      })
      .catch(() => undefined);
  }, [screen]);

  if (screen === "login" || screen === "register") {
    return (
      <AuthScreen
        register={screen === "register"}
        onToggle={() => navigate(screen === "login" ? "register" : "login")}
        onSubmit={async ({ name, email, password }) => {
          if (screen === "register") {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: { data: { name }, emailRedirectTo: Linking.createURL("auth/callback") },
            });
            if (error) throw error;
            if (!data.session)
              throw new Error("Check your email to confirm your account, then log in.");
          } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
          }
          await navigateAfterAuth();
        }}
      />
    );
  }

  if (screen === "add") {
    return (
      <AddMealScreen
        onBack={() => navigate("home")}
        onAnalyze={async (photoUri) => {
          setAnalyzedItems(await analyzeMeal(photoUri));
          navigate("analysis");
        }}
      />
    );
  }

  if (screen === "analysis") {
    return (
      <AnalysisScreen
        items={analyzedItems}
        onBack={() => navigate("add")}
        onSave={async () => {
          const totals = analyzedItems.reduce(
            (sum, item) => ({
              calories: sum.calories + item.calories,
              protein: sum.protein + item.protein,
              carbs: sum.carbs + item.carbs,
              fat: sum.fat + item.fat,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
          );
          const name = analyzedItems.map((item) => item.name).join(" + ") || "Analyzed meal";
          await saveMeal({
            mealType: "Dinner",
            name,
            ...totals,
            items: analyzedItems,
          });
          setMeals((current) => [
            ...current,
            {
              id: Date.now(),
              type: "Dinner",
              emoji: "🍽️",
              name,
              ...totals,
              items: analyzedItems.map((item) => ({
                ...item,
                grams: Math.round(item.grams),
                calories: Math.round(item.calories),
                protein: Math.round(item.protein),
                carbs: Math.round(item.carbs),
                fat: Math.round(item.fat),
              })),
            },
          ]);
          navigate("home");
        }}
      />
    );
  }

  if (screen === "progress") {
    return (
      <ProgressScreen
        meals={meals}
        savedBurned={savedBurned}
        onHome={() => navigate("home")}
        onProfile={() => navigate("profile")}
      />
    );
  }

  if (screen === "profile") {
    return (
      <ProfileScreen
        weightKg={weightKg}
        heightCm={heightCm}
        onSave={async (weight, height) => {
          await saveProfileMeasurements(weight, height);
          setWeightKg(weight);
          setHeightCm(height);
          if (requiredProfile) {
            setRequiredProfile(false);
            navigate("home");
          }
        }}
        onHome={() => navigate("home")}
        onProgress={() => navigate("progress")}
        onSignOut={async () => {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          setRequiredProfile(false);
          navigate("login");
        }}
        required={requiredProfile}
      />
    );
  }

  return (
    <HomeScreen
      meals={meals}
      mealsLoading={mealsLoading}
      mealsError={mealsError}
      onReloadMeals={loadMeals}
      savedBurned={savedBurned}
      onSaveSession={async (durationSeconds, caloriesBurned) => {
        await saveWalkingSession({ durationSeconds, caloriesBurned });
        setSavedBurned((current) => current + caloriesBurned);
      }}
      onAdd={() => navigate("add")}
      onDelete={async (id) => {
        await deleteMeal(id);
        setMeals((current) => current.filter((meal) => meal.id !== id));
      }}
      onProgress={() => navigate("progress")}
      onProfile={() => navigate("profile")}
    />
  );
}

export default GetFitApp;
