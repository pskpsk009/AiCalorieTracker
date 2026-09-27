import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { styles } from "../styles";
import { Button, Header } from "./shared";

export function ProfileScreen({
  weightKg,
  heightCm,
  onSave,
  onHome,
  onProgress,
  onSignOut,
  required = false,
}: {
  weightKg: number | null;
  heightCm: number | null;
  onSave: (weight: number, height: number) => Promise<void>;
  onHome: () => void;
  onProgress: () => void;
  onSignOut: () => Promise<void>;
  required?: boolean;
}) {
  const [weight, setWeight] = useState(weightKg?.toString() ?? "");
  const [height, setHeight] = useState(heightCm?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bmi =
    Number(weight) > 0 && Number(height) > 0 ? Number(weight) / (Number(height) / 100) ** 2 : null;

  const save = async () => {
    const nextWeight = Number(weight);
    const nextHeight = Number(height);
    if (
      !Number.isFinite(nextWeight) ||
      !Number.isFinite(nextHeight) ||
      nextWeight <= 0 ||
      nextHeight <= 0
    ) {
      setError("Enter a valid weight and height.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(nextWeight, nextHeight);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save your measurements.",
      );
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    setError(null);
    setSigningOut(true);
    try {
      await onSignOut();
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not sign out.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={required ? "Set up your profile" : "Profile"} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YOUR MEASUREMENTS</Text>
        <Text style={styles.profileTitle}>Body metrics</Text>
        <Text style={styles.subtitle}>
          {required
            ? "Add your measurements to continue to GetFit."
            : "Save your measurements to calculate your BMI."}
        </Text>
        <TextInput
          placeholder="Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <TextInput
          placeholder="Height (cm)"
          value={height}
          onChangeText={setHeight}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        {bmi !== null && (
          <View style={styles.bmiCard}>
            <Text style={styles.muted}>YOUR BMI</Text>
            <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
            <Text style={styles.muted}>
              {bmi < 18.5
                ? "Below typical range"
                : bmi < 25
                  ? "Typical range"
                  : bmi < 30
                    ? "Above typical range"
                    : "High range"}
            </Text>
          </View>
        )}
        {error && <Text style={styles.authError}>{error}</Text>}
        <Button
          label={saving ? "Saving..." : "Save measurements"}
          onPress={save}
          secondary={saving}
        />
        {!required && (
          <Button label={signingOut ? "Signing out..." : "Sign out"} onPress={signOut} secondary />
        )}
      </ScrollView>
      {!required && (
        <View style={styles.bottomNav}>
          <Pressable style={styles.navItemButton} onPress={onHome}>
            <Text style={styles.navItemText}>⌂ Home</Text>
          </Pressable>
          <Pressable style={styles.navItemButton} onPress={onProgress}>
            <Text style={styles.navItemText}>▥ Progress</Text>
          </Pressable>
          <View style={styles.navActive}>
            <Text style={styles.navActiveText}>◉ Profile</Text>
          </View>
        </View>
      )}
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
