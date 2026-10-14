import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles";
import { Button, Header } from "./shared";

export function ForgotPasswordScreen({
  onSubmit,
  onBack,
}: {
  onSubmit: (email: string) => Promise<void>;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim()) return setError("Enter your email.");
    setLoading(true);
    try {
      await onSubmit(email.trim());
      setSent(true);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not send email.";
      setError(
        message.toLowerCase().includes("rate limit")
          ? "Too many emails requested. Wait a minute and try again."
          : message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.auth}>
        <Header />
        <Text style={styles.title}>Forgot password</Text>
        <Text style={styles.subtitle}>
          Enter the email you signed up with and we'll send you a link to set a new password.
        </Text>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        {error && <Text style={styles.authError}>{error}</Text>}
        {sent && (
          <Text style={styles.authSuccess}>
            If an account exists for that email, a reset link is on its way. Open it on this device.
          </Text>
        )}
        <Button
          label={loading ? "Sending..." : sent ? "Send again" : "Send reset link  ›"}
          onPress={submit}
          secondary={loading}
        />
        <Pressable onPress={onBack}>
          <Text style={styles.switchText}>Back to Login</Text>
        </Pressable>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
