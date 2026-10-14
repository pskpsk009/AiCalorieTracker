import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { styles } from "../styles";

export type NavTab = "home" | "progress" | "profile";

type IconName = ComponentProps<typeof Ionicons>["name"];

const TABS: { tab: NavTab; label: string; icon: IconName; activeIcon: IconName }[] = [
  { tab: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  { tab: "progress", label: "Progress", icon: "stats-chart-outline", activeIcon: "stats-chart" },
  { tab: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" },
];

export function BottomNav({
  active,
  onNavigate,
}: {
  active: NavTab;
  onNavigate: (tab: NavTab) => void;
}) {
  return (
    <View style={styles.bottomNav}>
      {TABS.map(({ tab, label, icon, activeIcon }) => {
        const isActive = tab === active;
        return (
          <Pressable
            key={tab}
            onPress={() => !isActive && onNavigate(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
            style={({ pressed }) => [
              styles.navTab,
              isActive && styles.navTabActive,
              pressed && !isActive && styles.navTabPressed,
            ]}
          >
            <Ionicons
              name={isActive ? activeIcon : icon}
              size={20}
              color={isActive ? "#fff" : "#9aa69e"}
            />
            <Text style={isActive ? styles.navActiveText : styles.navItemText}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
