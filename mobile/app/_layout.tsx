import { Stack } from "expo-router";
import { AppStateProvider } from "../lib/app-state";

// Tab-like screens (home, progress, profile, auth) cross-fade; screens you drill into slide in.
const slideIn = { animation: "slide_from_right" } as const;

export default function RootLayout() {
  return (
    <AppStateProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 220,
          contentStyle: { backgroundColor: "#f7f5ed" },
        }}
      >
        <Stack.Screen name="add" options={slideIn} />
        <Stack.Screen name="analysis" options={slideIn} />
        <Stack.Screen name="change-password" options={slideIn} />
        <Stack.Screen name="forgot-password" options={slideIn} />
      </Stack>
    </AppStateProvider>
  );
}
