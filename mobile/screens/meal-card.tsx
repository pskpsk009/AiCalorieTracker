import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { styles } from "../styles";
import type { Meal } from "../lib/app-state";
import { timeOfDay } from "../lib/date-range";

/** Without `onDelete` the card is read-only (e.g. when browsing past days). */
export function MealCard({ meal, onDelete }: { meal: Meal; onDelete?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? (meal.items ?? []) : (meal.items ?? []).slice(0, 3);
  const hasMore = (meal.items?.length ?? 0) > 3;

  return (
    <View style={styles.meal}>
      <Text style={styles.mealEmoji}>{meal.emoji}</Text>
      <View style={styles.mealInfo}>
        <Text style={styles.eyebrow}>
          {meal.eatenAt ? `${meal.type.toUpperCase()} · ${timeOfDay(meal.eatenAt)}` : meal.type}
        </Text>
        <Text style={styles.mealName} numberOfLines={1} ellipsizeMode="tail">
          {meal.name}
        </Text>
        <Text style={styles.muted}>
          P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
        </Text>
        {visibleItems.map((item) => (
          <Text key={item.id ?? item.name} style={styles.mealItemText}>
            {item.name} · {item.grams}g · {item.calories} kcal
          </Text>
        ))}
        {hasMore && (
          <Pressable onPress={() => setExpanded((current) => !current)}>
            <Text style={styles.moreItems}>{expanded ? "... less" : "... more"}</Text>
          </Pressable>
        )}
      </View>
      <View>
        <Text style={styles.mealCalories}>
          {meal.calories} <Text style={styles.mealKcal}>kcal</Text>
        </Text>
        {onDelete && (
          <Pressable
            style={styles.deleteButton}
            onPress={() =>
              Alert.alert("Delete meal?", `Remove ${meal.name} from today's meals?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: onDelete },
              ])
            }
          >
            <Text style={styles.deleteIcon}>⌫</Text>
            <Text style={styles.delete}>Delete</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
