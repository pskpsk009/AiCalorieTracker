import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAppState } from "./lib/app-state";
import { analyzeMeal } from "./lib/meal-analysis";
import { dayKey } from "./lib/date-range";
import { isDayConfirmed, setDayConfirmed } from "./lib/day-confirmations";
import { deleteMeal, getMeals, saveMeal } from "./lib/meals";
import {
  getProfile,
  saveProfileMeasurements,
  saveProfileTimeZone,
  type ProfileData,
} from "./lib/profile";
import { getDeviceTimeZone } from "./lib/timezone";
import { getWalkingSessions, saveWalkingSession } from "./lib/walking";
import { supabase } from "./lib/supabase";
import { AddMealScreen } from "./screens/add-meal-screen";
import { AnalysisScreen } from "./screens/analysis-screen";
import { AuthScreen } from "./screens/auth-screen";
import { ChangePasswordScreen } from "./screens/change-password-screen";
import { ForgotPasswordScreen } from "./screens/forgot-password-screen";
import { HomeScreen } from "./screens/home-screen";
import { ProfileScreen } from "./screens/profile-screen";
import { ProgressScreen } from "./screens/progress-screen";

type Screen =
  | "login"
  | "register"
  | "forgot-password"
  | "change-password"
  | "home"
  | "add"
  | "analysis"
  | "progress"
  | "profile";

const pushedScreens: Screen[] = ["add", "analysis", "change-password", "forgot-password"];

// Screens reachable without a saved weight + height.
const ungatedScreens: Screen[] = ["login", "register", "forgot-password", "change-password"];

export function GetFitApp({
  initialScreen = "login",
  recovery = false,
}: {
  initialScreen?: Screen;
  recovery?: boolean;
}) {
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
    timeZone,
    setTimeZone,
  } = useAppState();
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [mealsError, setMealsError] = useState<string | null>(null);
  const [requiredProfile, setRequiredProfile] = useState(false);
  const [todayConfirmed, setTodayConfirmed] = useState<boolean | null>(null);
  // Every signed-in screen is gated on weight + height, which BMI depends on.
  const [checkingProfile, setCheckingProfile] = useState(
    !ungatedScreens.includes(initialScreen) && (weightKg === null || heightCm === null),
  );

  // Bottom-nav and auth screens replace each other (a cross-fade, no ever-growing stack);
  // add/analysis/password screens are pushed so Back returns to where you came from.
  const navigate = (nextScreen: Screen) => {
    setScreen(nextScreen);
    if (pushedScreens.includes(nextScreen)) router.push(`/${nextScreen}`);
    else router.replace(`/${nextScreen}`);
  };
  const goBack = (fallback: Screen) => {
    if (router.canGoBack()) router.back();
    else navigate(fallback);
  };

  // Put a freshly loaded profile into app state. A profile without a time zone gets the
  // device's zone, saved once so the database (weight-history dates) agrees with the app.
  const applyProfile = (profile: ProfileData) => {
    setWeightKg(profile.weightKg);
    setHeightCm(profile.heightCm);
    if (profile.timeZone) {
      setTimeZone(profile.timeZone);
      return;
    }
    const deviceZone = getDeviceTimeZone();
    if (deviceZone) {
      setTimeZone(deviceZone);
      void saveProfileTimeZone(deviceZone).catch(() => undefined);
    }
  };

  const navigateAfterAuth = async () => {
    const profile = await getProfile();
    applyProfile(profile);
    const needsProfile = profile.weightKg === null || profile.heightCm === null;
    router.replace(needsProfile ? "/profile" : "/home");
  };

  useEffect(() => {
    if (!checkingProfile) return;
    void getProfile()
      .then((profile) => {
        applyProfile(profile);
        if (profile.weightKg === null || profile.heightCm === null) {
          setRequiredProfile(true);
          setScreen("profile");
        }
      })
      .catch(() => undefined)
      .finally(() => setCheckingProfile(false));
  }, []);

  const loadMeals = async () => {
    // Loaded on its own so Home still works if the confirmations table isn't migrated yet.
    void isDayConfirmed(dayKey(new Date()))
      .then(setTodayConfirmed)
      .catch(() => setTodayConfirmed(null));
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
    if (screen === "home" && !checkingProfile) void loadMeals();
  }, [screen, checkingProfile]);

  useEffect(() => {
    if (screen !== "profile") return;
    void getProfile()
      .then(applyProfile)
      .catch(() => undefined);
  }, [screen]);

  if (checkingProfile) return null;

  if (screen === "forgot-password") {
    return (
      <ForgotPasswordScreen
        onBack={() => goBack("login")}
        onSubmit={async (email) => {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: Linking.createURL("auth/callback"),
          });
          if (error) throw error;
        }}
      />
    );
  }

  if (screen === "change-password") {
    const leave = () => (recovery ? router.replace("/home") : goBack("profile"));
    return (
      <ChangePasswordScreen
        recovery={recovery}
        onBack={leave}
        onSave={async ({ currentPassword, newPassword }) => {
          if (!recovery) {
            // Re-check the current password so an unlocked phone can't be used to take over the account.
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!userData.user?.email) throw new Error("Please sign in again.");
            const { error: verifyError } = await supabase.auth.signInWithPassword({
              email: userData.user.email,
              password: currentPassword,
            });
            if (verifyError) throw new Error("Current password is incorrect.");
          }
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          Alert.alert("Password updated", "Use your new password next time you log in.");
          leave();
        }}
      />
    );
  }

  if (screen === "login" || screen === "register") {
    return (
      <AuthScreen
        register={screen === "register"}
        onToggle={() => navigate(screen === "login" ? "register" : "login")}
        onForgotPassword={() => navigate("forgot-password")}
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
        onBack={() => goBack("home")}
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
        onBack={() => goBack("add")}
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
          const savedMeal = await saveMeal({
            mealType: "Dinner",
            name,
            ...totals,
            items: analyzedItems,
          });
          setMeals((current) => [
            ...current,
            {
              id: savedMeal.id,
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
          // Pop add + analysis off the stack back to the Home underneath.
          if (router.canDismiss()) router.dismissTo("/home");
          else navigate("home");
        }}
      />
    );
  }

  if (screen === "progress") {
    return (
      <ProgressScreen
        meals={meals}
        savedBurned={savedBurned}
        weightKg={weightKg}
        heightCm={heightCm}
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
            router.replace("/home");
          }
        }}
        onHome={() => navigate("home")}
        onProgress={() => navigate("progress")}
        onChangePassword={() => navigate("change-password")}
        timeZone={timeZone}
        onChangeTimeZone={async (next) => {
          await saveProfileTimeZone(next);
          setTimeZone(next);
        }}
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
      todayConfirmed={todayConfirmed}
      onSetTodayConfirmed={async (confirmed) => {
        await setDayConfirmed(dayKey(new Date()), confirmed);
        setTodayConfirmed(confirmed);
      }}
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
