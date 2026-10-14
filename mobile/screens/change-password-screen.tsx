import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ScrollView, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles";
import { Button, Header } from "./shared";

const MIN_PASSWORD_LENGTH = 6;

export function ChangePasswordScreen({
  recovery,
  onSave,
  onBack,
}: {
  /** Opened from a reset email: the user is signed in by the link and has no current password. */
  recovery: boolean;
  onSave: (values: { currentPassword: string; newPassword: string }) => Promise<void>;
  onBack: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setError(null);
    if (!recovery && !currentPassword) return setError("Enter your current password.");
    if (newPassword.length < MIN_PASSWORD_LENGTH)
      return setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (newPassword !== confirmPassword) return setError("New passwords do not match.");
    if (!recovery && newPassword === currentPassword)
      return setError("New password must be different from your current one.");
    setSaving(true);
    try {
      await onSave({ currentPassword, newPassword });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not change your password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={recovery ? "Reset password" : "Change password"} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>ACCOUNT SECURITY</Text>
        <Text style={styles.profileTitle}>
          {recovery ? "Set a new password" : "Change your password"}
        </Text>
        <Text style={styles.subtitle}>
          Use at least {MIN_PASSWORD_LENGTH} characters. You'll use this password next time you log
          in.
        </Text>
        {!recovery && (
          <TextInput
            placeholder="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            style={styles.input}
          />
        )}
        <TextInput
          placeholder="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          placeholder="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
        />
        {error && <Text style={styles.authError}>{error}</Text>}
        <Button
          label={saving ? "Saving..." : "Save new password"}
          onPress={save}
          secondary={saving}
        />
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
