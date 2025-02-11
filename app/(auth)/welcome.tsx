import { View, StyleSheet } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text variant="displaySmall" style={styles.title}>
        Welcome to WellFit
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Your personalized fitness companion
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => router.push("/(auth)/signup")}
          style={styles.button}
        >
          Get Started
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.push("/(auth)/signin")}
          style={styles.button}
        >
          I already have an account
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 40,
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    marginVertical: 5,
  },
});
