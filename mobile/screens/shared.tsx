import { Pressable, Text, View } from "react-native";
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
    <Pressable onPress={onPress} style={[styles.button, secondary && styles.secondaryButton]}>
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
