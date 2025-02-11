import { Tabs, Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WorkoutProvider } from "../../contexts/WorkoutContext";

export default function AppLayout() {
  return (
    <WorkoutProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="workout/create"
          options={{
            title: "Create Workout",
            headerShown: true,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="workout/[id]"
          options={{
            title: "Workout",
            headerShown: true,
          }}
        />
      </Stack>
    </WorkoutProvider>
  );
}
