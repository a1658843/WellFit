import { View, StyleSheet } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      console.log("Starting sign in..."); // Debug log
      setLoading(true);
      setError(null);

      if (!email || !password) {
        throw new Error("Please enter both email and password");
      }

      console.log("Attempting to sign in with:", email); // Debug log
      await signIn(email, password);
      console.log("Sign in successful"); // Debug log

      // On successful login, the auth listener in _layout will redirect to app
    } catch (err) {
      console.error("Sign in error:", err); // Debug log
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome Back
      </Text>

      {error && (
        <Text style={styles.error} variant="bodyMedium">
          {error}
        </Text>
      )}

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        disabled={loading}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        disabled={loading}
      />

      <Button
        mode="contained"
        onPress={handleSignIn}
        loading={loading}
        disabled={loading || !email || !password}
        style={styles.button}
      >
        {loading ? "Signing In..." : "Sign In"}
      </Button>

      <Button
        mode="text"
        onPress={() => router.push("/(auth)/signup")}
        style={styles.button}
        disabled={loading}
      >
        Don't have an account? Sign Up
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});
