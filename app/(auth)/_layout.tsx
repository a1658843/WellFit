import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="welcome"
        options={{
          title: "Welcome",
        }}
      />
      <Stack.Screen
        name="signin"
        options={{
          title: "Sign In",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: "Sign Up",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
