import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles";
import { Button, Header } from "./shared";

export function AuthScreen({
  register,
  onToggle,
  onForgotPassword,
  onSubmit,
}: {
  register: boolean;
  onToggle: () => void;
  onForgotPassword: () => void;
  onSubmit: (values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) return setError("Enter your email and password.");
    if (register && password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), password, confirmPassword });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Authentication failed.";
      setError(
        message.toLowerCase().includes("rate limit")
          ? "Supabase email limit reached. Wait before requesting another confirmation email, or disable email confirmation while developing."
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
        <Text style={styles.title}>{register ? "Create your account" : "Welcome back"}</Text>
        <Text style={styles.subtitle}>
          {register
            ? "Start building healthier habits, one meal at a time."
            : "Track your meals and keep today in view."}
        </Text>
        {register && (
          <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
        )}
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        {!register && (
          <Pressable onPress={onForgotPassword}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        )}
        {register && (
          <TextInput
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
          />
        )}
        {error && <Text style={styles.authError}>{error}</Text>}
        <Button
          label={loading ? "Please wait..." : register ? "Register  ›" : "Login  ›"}
          onPress={submit}
        />
        <Pressable onPress={onToggle}>
          <Text style={styles.switchText}>
            {register ? "Already have an account? Login" : "New to GetFit? Register"}
          </Text>
        </Pressable>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
