import { View, StyleSheet, ScrollView } from "react-native";
import {
  Button,
  Text,
  TextInput,
  HelperText,
  Surface,
  Snackbar,
} from "react-native-paper";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "expo-router";

type Profession = {
  id: number;
  name: string;
};

type UserProfile = {
  id: string;
  full_name: string | null;
  profession_id: number | null;
  fitness_level: string | null;
};

export default function EditProfile() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [selectedProfession, setSelectedProfession] = useState<number | null>(
    null
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    Promise.all([loadProfessions(), loadUserProfile()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const loadProfessions = async () => {
    try {
      const { data, error } = await supabase
        .from("professions")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setProfessions(data || []);
    } catch (error) {
      console.error("Error loading professions:", error);
      alert("Failed to load professions. Please try again.");
    }
  };

  const loadUserProfile = async () => {
    if (!session?.user?.id) return;

    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") throw profileError;

      // Load user data (for profession)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("profession_id, fitness_level")
        .eq("id", session.user.id)
        .single();

      if (userError) throw userError;

      setProfile({
        id: session.user.id,
        full_name: profileData?.full_name || null,
        ...userData,
      });
      setFullName(profileData?.full_name || "");
      setSelectedProfession(userData.profession_id);
    } catch (error) {
      console.error("Error loading profile:", error);
      alert("Failed to load profile. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;

    try {
      setSaving(true);

      // Update user profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          id: session.user.id,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // Update profession
      const { error: userError } = await supabase
        .from("users")
        .update({
          profession_id: selectedProfession,
        })
        .eq("id", session.user.id);

      if (userError) throw userError;

      // Show snackbar briefly and navigate back
      setVisible(true);
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
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
    <>
      <ScrollView style={styles.container}>
        <Surface style={styles.form} elevation={1}>
          <Text variant="headlineSmall" style={styles.title}>
            Edit Profile
          </Text>

          <TextInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            style={styles.input}
            placeholder="Enter your name"
          />

          <Text variant="bodyMedium" style={styles.label}>
            Profession
          </Text>
          <ScrollView horizontal style={styles.professionList}>
            {professions.map((profession) => (
              <Button
                key={profession.id}
                mode={
                  selectedProfession === profession.id
                    ? "contained"
                    : "outlined"
                }
                onPress={() => setSelectedProfession(profession.id)}
                style={styles.professionButton}
              >
                {profession.name}
              </Button>
            ))}
          </ScrollView>

          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.button}
            loading={saving}
            disabled={saving}
          >
            Save Changes
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.button}
            disabled={saving}
          >
            Cancel
          </Button>
        </Surface>
      </ScrollView>

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={1000}
      >
        Profile updated successfully
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 10,
  },
  professionList: {
    marginBottom: 20,
  },
  professionButton: {
    marginRight: 10,
  },
  button: {
    marginTop: 10,
  },
});
