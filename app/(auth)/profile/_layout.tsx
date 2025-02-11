import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="profession"
        options={{
          title: "Select Profession",
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          title: "Additional Details",
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="schedule"
        options={{
          title: "Work Schedule",
          headerBackVisible: true,
        }}
      />
    </Stack>
  );
}
