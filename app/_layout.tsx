import { Stack, useSegments, useRouter } from "expo-router";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { AuthProvider } from "../contexts/AuthContext";
import { View, Text } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";
import { WorkoutProvider } from "../contexts/WorkoutContext";
import { AITrainerProvider } from "../contexts/AITrainerContext";

// Define the theme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2196F3",
    secondary: "#1976D2",
    background: "#F5F5F5",
  },
};

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { session, loading, hasCompletedProfile } = useAuth();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";

    console.log("Navigation state:", {
      inAuthGroup,
      inAppGroup,
      hasSession: !!session,
      hasCompletedProfile,
      loading,
    });

    // Only handle redirects after initial load
    if (!loading) {
      if (!session && !inAuthGroup) {
        // Redirect to sign in if not authenticated
        router.replace("/(auth)/welcome");
      } else if (session && !hasCompletedProfile && segments[0] !== "profile") {
        // Redirect to profile completion if needed
        router.replace("/(auth)/profile/profession");
      } else if (session && hasCompletedProfile && !inAppGroup) {
        // Redirect to app if authenticated and profile completed
        router.replace("/(app)");
      }
    }
  }, [session, loading, segments, hasCompletedProfile]);

  return loading;
}

function RootLayoutNav() {
  const loading = useProtectedRoute();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <WorkoutProvider>
          <AITrainerProvider>
            <RootLayoutNav />
          </AITrainerProvider>
        </WorkoutProvider>
      </PaperProvider>
    </AuthProvider>
  );
}
