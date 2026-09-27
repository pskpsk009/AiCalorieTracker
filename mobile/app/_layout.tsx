import { Stack } from "expo-router";
import { AppStateProvider } from "../lib/app-state";

export default function RootLayout() {
  return (
    <AppStateProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppStateProvider>
  );
}
