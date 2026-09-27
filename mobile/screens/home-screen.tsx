import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import type { Meal } from "../lib/app-state";
import { styles } from "../styles";
import { Button, Header } from "./shared";
import { MealCard } from "./meal-card";

export function HomeScreen({
  meals,
  mealsLoading,
  mealsError,
  onReloadMeals,
  savedBurned,
  onSaveSession,
  onAdd,
  onDelete,
  onProgress,
  onProfile,
}: {
  meals: Meal[];
  mealsLoading: boolean;
  mealsError: string | null;
  onReloadMeals: () => void;
  savedBurned: number;
  onSaveSession: (durationSeconds: number, caloriesBurned: number) => Promise<void>;
  onAdd: () => void;
  onDelete: (id: number) => Promise<void>;
  onProgress: () => void;
  onProfile: () => void;
}) {
  const [walkingStatus, setWalkingStatus] = useState<"idle" | "running" | "paused" | "complete">(
    "idle",
  );
  const [elapsed, setElapsed] = useState(0);
  const [savingWalking, setSavingWalking] = useState(false);
  const [walkingError, setWalkingError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [thailandTime, setThailandTime] = useState(() =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
  const totals = useMemo(
    () =>
      meals.reduce(
        (sum, meal) => ({
          calories: sum.calories + meal.calories,
          protein: sum.protein + meal.protein,
          carbs: sum.carbs + meal.carbs,
          fat: sum.fat + meal.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [meals],
  );

  useEffect(() => {
    if (walkingStatus !== "running") return;
    const interval = setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => clearInterval(interval);
  }, [walkingStatus]);
  useEffect(() => {
    const clock = setInterval(
      () =>
        setThailandTime(
          new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Bangkok",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(new Date()),
        ),
      60_000,
    );
    return () => clearInterval(clock);
  }, []);

  const estimatedMinutes = Math.max(1, Math.round(totals.calories * 0.15));
  const timerText = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const burned = elapsed > 0 ? Math.max(1, Math.round((elapsed / 60) * 5)) : 0;
  const resetWalking = () => {
    setElapsed(0);
    setWalkingStatus("idle");
  };
  const saveWalking = async () => {
    setWalkingError(null);
    setSavingWalking(true);
    try {
      await onSaveSession(elapsed, burned);
      resetWalking();
    } catch (error) {
      setWalkingError(error instanceof Error ? error.message : "Could not save walking session.");
    } finally {
      setSavingWalking(false);
    }
  };
  const handleDelete = async (mealId: number) => {
    setDeleteError(null);
    try {
      await onDelete(mealId);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete this meal.");
    }
  };
  const netCalories = totals.calories - savedBurned;
  const calorieDifference = netCalories - 1800;

  if (mealsLoading)
    return (
      <SafeAreaView style={styles.safe}>
        <Header />
        <View style={styles.centerState}>
          <Text style={styles.sectionTitle}>Loading your meals...</Text>
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>TODAY'S NUTRITION</Text>
        {mealsError && (
          <View style={styles.errorState}>
            <Text style={styles.authError}>{mealsError}</Text>
            <Button label="Retry" onPress={onReloadMeals} secondary />
          </View>
        )}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Calories</Text>
          <Text style={styles.calories}>
            {totals.calories.toLocaleString()} <Text style={styles.kcal}>kcal</Text>
          </Text>
          <View style={styles.macroRow}>
            {[
              ["Protein", totals.protein],
              ["Carbs", totals.carbs],
              ["Fat", totals.fat],
            ].map(([label, value]) => (
              <View key={String(label)} style={styles.macro}>
                <Text style={styles.macroLabel}>{label}</Text>
                <Text style={styles.macroValue}>{value}g</Text>
              </View>
            ))}
          </View>
        </View>
        <Button label="＋  Add Meal" onPress={onAdd} />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <Text style={styles.muted}>{meals.length} logged</Text>
        </View>
        {deleteError && <Text style={styles.uploadError}>{deleteError}</Text>}
        {meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} onDelete={() => void handleDelete(meal.id)} />
        ))}
        {walkingStatus === "complete" ? (
          <View style={styles.completeCard}>
            <View style={styles.completeHeader}>
              <View style={styles.completeIcon}>
                <Text>✓</Text>
              </View>
              <View>
                <Text style={styles.completeTitle}>Walking Complete</Text>
                <Text style={styles.muted}>Ready to add to today's activity</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.muted}>Duration</Text>
                <Text style={styles.statValue}>
                  {elapsed < 60 ? `${elapsed} sec` : `${Math.round(elapsed / 60)} min`}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.muted}>Calories Burned</Text>
                <Text style={styles.statValue}>{burned} kcal</Text>
              </View>
            </View>
            <View style={styles.completeActions}>
              <Pressable style={styles.discardButton} onPress={resetWalking}>
                <Text style={styles.discardText}>↻ Discard</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={saveWalking}>
                <Text style={styles.saveText}>
                  {savingWalking ? "Saving..." : "▣ Save Session"}
                </Text>
              </Pressable>
            </View>
            {walkingError && <Text style={styles.uploadError}>{walkingError}</Text>}
          </View>
        ) : (
          <View style={styles.walking}>
            <View style={styles.walkingHeader}>
              <View style={styles.walkingIcon}>
                <Text>♧</Text>
              </View>
              <View>
                <Text style={styles.walkingTitle}>Walking</Text>
                <Text style={styles.walkingSubtitle}>
                  {walkingStatus === "idle"
                    ? "Based on today's meals"
                    : walkingStatus === "paused"
                      ? "Session paused"
                      : "Session in progress"}
                </Text>
              </View>
              <Text style={styles.thailandTime}>{thailandTime}</Text>
            </View>
            {walkingStatus === "idle" ? (
              <View style={styles.walkingAction}>
                <View>
                  <Text style={styles.walkingLabel}>Estimated walking time</Text>
                  <Text style={styles.walkingTime}>
                    ~{estimatedMinutes} <Text style={styles.walkingUnit}>minutes</Text>
                  </Text>
                </View>
                <Pressable style={styles.startButton} onPress={() => setWalkingStatus("running")}>
                  <Text style={styles.startButtonText}>▷ Start</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.timerCenter}>
                  <Text style={styles.timerText}>{timerText}</Text>
                  <Text style={styles.walkingLabel}>Estimated Calories Burned</Text>
                  <Text style={styles.burnedText}>{burned} kcal</Text>
                </View>
                <View style={styles.timerActions}>
                  <Pressable
                    style={styles.pauseButton}
                    onPress={() =>
                      setWalkingStatus(walkingStatus === "paused" ? "running" : "paused")
                    }
                  >
                    <Text style={styles.pauseText}>
                      {walkingStatus === "paused" ? "▷  Resume" : "Ⅱ  Pause"}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.stopButton} onPress={() => setWalkingStatus("complete")}>
                    <Text style={styles.stopText}>□ Stop</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}
        {savedBurned > 0 && (
          <View style={styles.calorieCard}>
            <View style={styles.calorieHeading}>
              <Text style={styles.fire}>♨</Text>
              <Text style={styles.calorieTitle}>Calorie Summary</Text>
            </View>
            <View style={styles.calorieLine}>
              <Text style={styles.muted}>Consumed</Text>
              <Text style={styles.calorieValue}>{totals.calories.toLocaleString()} kcal</Text>
            </View>
            <View style={styles.calorieLine}>
              <Text style={styles.muted}>Burned walking</Text>
              <Text style={styles.burnedValue}>- {savedBurned} kcal</Text>
            </View>
            <View style={styles.calorieDivider} />
            <View style={styles.calorieLine}>
              <Text style={styles.netLabel}>Net Calories</Text>
              <Text style={styles.netValue}>{netCalories.toLocaleString()} kcal</Text>
            </View>
            <View style={styles.deficit}>
              <Text style={styles.deficitLabel}>COMPARED WITH YOUR 1,800 KCAL REFERENCE</Text>
              <Text style={styles.deficitValue}>
                {Math.abs(calorieDifference).toLocaleString()} kcal{" "}
                {calorieDifference > 0 ? "surplus" : calorieDifference < 0 ? "deficit" : "balanced"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.bottomNav}>
        <View style={styles.navActive}>
          <Text style={styles.navActiveText}>⌂ Home</Text>
        </View>
        <Pressable style={styles.navItemButton} onPress={onProgress}>
          <Text style={styles.navItemText}>▥ Progress</Text>
        </Pressable>
        <Pressable style={styles.navItemButton} onPress={onProfile}>
          <Text style={styles.navItemText}>◉ Profile</Text>
        </Pressable>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
