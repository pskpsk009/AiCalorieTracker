import { useEffect, useRef, type PropsWithChildren } from "react";
import { Animated, Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { styles } from "../styles";

export function Button({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>
    </Pressable>
  );
}

export function Header({ title, onBack }: { title?: string; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
      ) : (
        <Text style={styles.logo}>
          <Text style={styles.green}>Get</Text>Fit
        </Text>
      )}
      {title && <Text style={styles.headerTitle}>{title}</Text>}
      <View style={styles.headerSpace} />
    </View>
  );
}

/**
 * Logged food minus estimated walking calories. Deliberately not called a deficit or surplus:
 * it leaves out resting metabolism, digestion and all other activity.
 */
export function PartialEnergyCard({
  title,
  food,
  walking,
  style,
}: {
  title: string;
  food: number;
  walking: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <View style={styles.calorieHeading}>
        <Text style={styles.fire}>♨</Text>
        <Text style={styles.calorieTitle}>{title}</Text>
      </View>
      <View style={styles.calorieLine}>
        <Text style={styles.muted}>Food logged</Text>
        <Text style={styles.calorieValue}>{food.toLocaleString()} kcal</Text>
      </View>
      <View style={styles.calorieLine}>
        <Text style={styles.muted}>Walking (estimated)</Text>
        <Text style={styles.burnedValue}>− {walking.toLocaleString()} kcal</Text>
      </View>
      <View style={styles.calorieDivider} />
      <View style={styles.calorieLine}>
        <Text style={styles.netLabel}>Food − walking</Text>
        <Text style={styles.netValue}>{(food - walking).toLocaleString()} kcal</Text>
      </View>
      <View style={styles.partialNote}>
        <Text style={styles.deficitLabel}>PARTIAL FIGURE</Text>
        <Text style={styles.partialNoteText}>
          This leaves out the energy your body uses at rest, for digestion and for other activity,
          so it is not your calorie deficit or surplus.
        </Text>
      </View>
    </View>
  );
}

/** Fades and lifts its children in on mount. Give it a `key` to replay when content changes. */
export function FadeIn({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [progress]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
