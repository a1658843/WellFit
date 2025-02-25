import { View, StyleSheet, ScrollView } from "react-native";
import {
  Button,
  Text,
  TextInput,
  HelperText,
  Surface,
  Snackbar,
  Card,
  List,
  RadioButton,
} from "react-native-paper";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { useAITrainer } from "../../../contexts/AITrainerContext";
import { PROFESSIONS } from "../../../data/professions";

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
  const [selectedProfession, setSelectedProfession] = useState("");
  const [visible, setVisible] = useState(false);
  const [customProfession, setCustomProfession] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const { analyzeNewProfession } = useAITrainer();

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
      setSelectedProfession(userData.profession_id?.toString() || "");
    } catch (error) {
      console.error("Error loading profile:", error);
      alert("Failed to load profile. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!selectedProfession || !session?.user) return;

    try {
      setLoading(true);
      const professionData = PROFESSIONS.find(
        (p) => p.name === selectedProfession
      );

      if (!professionData) {
        console.error("Invalid profession selected");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          profession_data: professionData,
          profession_validated: true,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      // Reload profile data to reflect changes
      await loadUserProfile();

      setVisible(true);
      setTimeout(() => {
        router.push("/(app)/(tabs)/profile");
      }, 1000);
    } catch (error) {
      console.error("Error saving profession:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfessionInput = async (text: string) => {
    setCustomProfession(text);

    try {
      // Check for existing professions as suggestions
      const { data } = await supabase
        .from("professions")
        .select("id, name")
        .ilike("name", `${text}%`)
        .limit(5);

      // Remove duplicates and ensure unique suggestions
      const uniqueSuggestions = Array.from(
        new Set(data?.map((p) => p.name) || [])
      );
      setSuggestions(uniqueSuggestions);
    } catch (error) {
      console.error("Error getting suggestions:", error);
    }
  };

  const handleCustomProfession = async () => {
    if (!customProfession.trim()) return;

    try {
      setAnalyzing(true);
      setSaving(true);

      // Get profession analysis from AI
      const analysis = await analyzeNewProfession(customProfession);
      console.log("Raw analysis:", analysis); // Debug log

      if (!analysis) {
        throw new Error("Failed to analyze profession");
      }

      // Create or update profession
      const professionData = {
        name: customProfession,
        category: analysis.category,
        health_risks: analysis.health_risks,
        common_issues: analysis.exercise_recommendations.focus_areas.map(
          (area) => ({
            issue: area,
            severity: "medium",
          })
        ),
        work_characteristics: analysis.characteristics,
      };
      console.log("Profession data to insert:", professionData); // Debug log

      const { data: profession, error: professionError } = await supabase
        .from("professions")
        .insert([professionData])
        .select()
        .single();

      if (professionError) throw professionError;

      // Update user's profession
      if (profession?.id) {
        const workMode = analysis.characteristics.workplace.some(
          (w) => w.toLowerCase() === "active"
        )
          ? "active"
          : "sedentary";

        const { error: userError } = await supabase
          .from("users")
          .update({
            profession_id: profession.id,
            work_mode: workMode,
          })
          .eq("id", session?.user?.id);

        if (userError) throw userError;
      }

      // Show success message
      setVisible(true);
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error("Error saving profession:", error);
      alert("Failed to save profession. Please try again.");
    } finally {
      setAnalyzing(false);
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
          />

          <Text variant="bodyMedium" style={styles.label}>
            Your Profession
          </Text>

          <RadioButton.Group
            onValueChange={(value) => setSelectedProfession(value)}
            value={selectedProfession}
          >
            {PROFESSIONS.map((profession) => (
              <List.Item
                key={profession.name}
                title={profession.name}
                description={profession.category}
                onPress={() => setSelectedProfession(profession.name)}
                left={(props) => (
                  <RadioButton {...props} value={profession.name} />
                )}
                style={[
                  styles.listItem,
                  selectedProfession === profession.name && styles.selectedItem,
                ]}
              />
            ))}
          </RadioButton.Group>

          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={!selectedProfession || loading}
            style={styles.button}
          >
            Save
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.button}
            disabled={loading}
          >
            Cancel
          </Button>
        </Surface>
      </ScrollView>

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={1500}
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
  suggestionsCard: {
    marginTop: -10,
    marginBottom: 10,
  },
  suggestionButton: {
    justifyContent: "flex-start",
    paddingVertical: 4,
  },
  button: {
    marginTop: 10,
  },
  list: {
    flex: 1,
  },
  listItem: {
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "white",
  },
  selectedItem: {
    backgroundColor: "#e8f5e9",
  },
});
