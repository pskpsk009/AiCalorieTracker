import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AnalyzedMealItem } from "../lib/meal-analysis";
import { styles } from "../styles";
import { Button, Header } from "./shared";

export function AnalysisScreen({
  items,
  onBack,
  onSave,
}: {
  items: AnalyzedMealItem[];
  onBack: () => void;
  onSave: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const total = items.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      protein: sum.protein + item.protein,
      carbs: sum.carbs + item.carbs,
      fat: sum.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      await onSave();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Could not save this meal.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Your Meal" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.notice}>
          <Text>✨</Text>
          <Text>
            <Text style={styles.bold}>Analysis complete</Text>
            {"\n"}
            {items.length} foods detected
          </Text>
        </View>
        {items.map((item) => (
          <View style={styles.food} key={item.name}>
            <Text style={styles.mealEmoji}>🍽️</Text>
            <View style={styles.mealInfo}>
              <Text style={styles.mealName}>{item.name}</Text>
              <Text style={styles.muted}>{item.grams}g</Text>
            </View>
            <Text style={styles.mealCalories}>{item.calories} kcal</Text>
          </View>
        ))}
        <View style={styles.total}>
          <Text style={styles.muted}>MEAL TOTAL</Text>
          <Text style={styles.totalCalories}>
            {total.calories} <Text style={styles.kcal}>kcal</Text>
          </Text>
          <Text style={styles.muted}>
            Protein {total.protein}g Carbs {total.carbs}g Fat {total.fat}g
          </Text>
        </View>
        {saveError && <Text style={styles.uploadError}>{saveError}</Text>}
        <Button
          label={saving ? "Saving..." : "Save Meal"}
          onPress={handleSave}
          secondary={saving}
        />
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
