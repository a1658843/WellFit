import { Stack, useSegments, useRouter } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "../contexts/AuthContext";
import { View, Text } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";

function useProtectedRoute() {
  const { session, loading, hasCompletedProfile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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
      } else if (session && !hasCompletedProfile && segments[1] !== "profile") {
        // Redirect to profile completion if needed
        router.replace("/(auth)/profile/profession");
      } else if (session && hasCompletedProfile && !inAppGroup) {
        // Redirect to main app if authenticated and profile complete
        router.replace("/(app)");
      }
    }
  }, [session, loading, hasCompletedProfile, segments]);
}

function RootLayoutNav() {
  const { loading } = useAuth();
  const segments = useSegments();
  useProtectedRoute();

  const initializing = loading && segments.length === 0;
  const content = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <Text>Initializing...</Text>
      </View>
    );
  }

  return content;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider>
        <RootLayoutNav />
      </PaperProvider>
    </AuthProvider>
  );
}
