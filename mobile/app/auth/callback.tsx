import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const [message, setMessage] = useState("Confirming your email...");
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const finishAuth = async (url: string | null) => {
      if (!url) {
        setMessage("Open the confirmation link on the same device where Expo Go is running.");
        setFinished(true);
        return;
      }
      const parsed = Linking.parse(url);
      const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;
      const hash = url.split("#")[1] ?? "";
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const isRecovery =
        hashParams.get("type") === "recovery" || parsed.queryParams?.type === "recovery";
      const errorDescription = parsed.queryParams?.error_description;
      if (errorDescription) {
        setMessage(String(errorDescription));
        setFinished(true);
        return;
      }
      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : accessToken && refreshToken
          ? await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
          : { error: new Error("This confirmation link is invalid or expired.") };
      const { error } = result;
      if (error) {
        setMessage(error.message);
        setFinished(true);
        return;
      }
      router.replace(isRecovery ? "/change-password?recovery=1" : "/home");
    };

    Linking.getInitialURL().then(finishAuth);
    const subscription = Linking.addEventListener("url", ({ url }) => finishAuth(url));
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{message}</Text>
      {finished && (
        <Pressable style={styles.button} onPress={() => router.replace("/login")}>
          <Text style={styles.buttonText}>Back to Login</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f7f5ed",
  },
  title: { color: "#234c39", fontSize: 18, fontWeight: "700", textAlign: "center" },
  button: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#ef7444",
  },
  buttonText: { color: "#fff", fontWeight: "800" },
});
