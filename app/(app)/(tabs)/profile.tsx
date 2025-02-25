import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Button, Text, Surface, List } from "react-native-paper";
import { useAuth } from "../../../contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "expo-router";

export default function Profile() {
  const { signOut, session } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<{
    name: string;
    profession: string;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadUserProfile();
    }
  }, [session]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // First get user profile data (for full name)
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("id", session?.user?.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      // Then get profession data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          `
          email,
          profession_data
        `
        )
        .eq("id", session?.user?.id)
        .single();

      if (userError) throw userError;

      // Set profile with all available data
      setProfile({
        name:
          profileData?.full_name ||
          session?.user?.email?.split("@")[0] ||
          "User",
        profession: userData?.profession_data?.name || "No profession selected",
        email: userData?.email || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/welcome");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Surface style={styles.profileCard}>
          <Text variant="headlineMedium" style={styles.name}>
            {profile?.name || "User"}
          </Text>
          <Text variant="titleLarge" style={styles.profession}>
            {profile?.profession || "No profession selected"}
          </Text>
        </Surface>

        <Button
          mode="contained"
          onPress={() => router.push("/(app)/profile/edit")}
          style={styles.editButton}
        >
          Edit Profile
        </Button>

        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          Sign Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "white",
  },
  name: {
    marginBottom: 10,
    fontWeight: "bold",
  },
  profession: {
    opacity: 0.8,
    fontSize: 20,
  },
  editButton: {
    margin: 15,
  },
  signOutButton: {
    margin: 15,
  },
});
