import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Button, Text, Surface, List } from "react-native-paper";
import { useAuth } from "../../../contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, useFocusEffect } from "expo-router";

export default function Profile() {
  const { signOut, session } = useAuth();
  const [profile, setProfile] = useState<{
    name: string;
    profession: string;
    email: string;
  } | null>(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (session?.user) {
        loadProfile();
      }
    }, [session])
  );

  const loadProfile = async () => {
    if (!session?.user) return;

    try {
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      const { data: userData } = await supabase
        .from("users")
        .select(
          `
          professions:profession_id (
            name
          )
        `
        )
        .eq("id", session.user.id)
        .single();

      setProfile({
        name: profileData?.full_name || "Not set",
        profession: userData?.professions?.name || "Not set",
        email: session.user.email || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineMedium" style={styles.name}>
            {profile?.name}
          </Text>
          <Text variant="bodyLarge" style={styles.profession}>
            {profile?.profession}
          </Text>
        </Surface>

        <List.Section>
          <List.Item
            title="Edit Profile"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            onPress={() => router.push("/(app)/profile/edit")}
          />
          <List.Item
            title="Email"
            description={profile?.email}
            left={(props) => <List.Icon {...props} icon="email" />}
          />
          {/* Add more settings/options here */}
        </List.Section>

        <Button
          mode="outlined"
          onPress={signOut}
          style={styles.signOutButton}
          icon="logout"
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
  header: {
    marginTop: 10,
    marginHorizontal: 15,
    padding: 20,
    backgroundColor: "white",
    alignItems: "center",
    borderRadius: 10,
  },
  name: {
    marginBottom: 5,
  },
  profession: {
    opacity: 0.7,
  },
  signOutButton: {
    margin: 15,
  },
});
