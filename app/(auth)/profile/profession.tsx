import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Text, List } from "react-native-paper";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";

type Profession = {
  id: number;
  name: string;
  category: string;
};

export default function ProfessionSelect() {
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [selectedProfession, setSelectedProfession] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingProfessions, setLoadingProfessions] = useState(true);
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    loadProfessions();
  }, []);

  const loadProfessions = async () => {
    try {
      const { data, error } = await supabase
        .from("professions")
        .select("id, name, category");

      if (error) throw error;
      setProfessions(data || []);
    } catch (error) {
      console.error("Error loading professions:", error);
      alert("Failed to load professions. Please try again.");
    } finally {
      setLoadingProfessions(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedProfession || !session?.user) return;

    try {
      setLoading(true);

      // First check if user record exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (!existingUser) {
        // Create user record if it doesn't exist
        const { error: insertError } = await supabase.from("users").insert([
          {
            id: session.user.id,
            email: session.user.email,
            profession_id: selectedProfession,
          },
        ]);

        if (insertError) throw insertError;
      } else {
        // Update existing user record
        const { error: updateError } = await supabase
          .from("users")
          .update({ profession_id: selectedProfession })
          .eq("id", session.user.id);

        if (updateError) throw updateError;
      }

      router.push("/(auth)/profile/details");
    } catch (error) {
      console.error("Error saving profession:", error);
      alert("Failed to save profession. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfessions) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading professions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>
        What's your profession?
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        This helps us customize exercises for your work routine
      </Text>

      <ScrollView style={styles.list}>
        {professions.map((profession) => (
          <List.Item
            key={profession.id}
            title={profession.name}
            description={profession.category}
            onPress={() => setSelectedProfession(profession.id)}
            left={(props) => (
              <List.Icon
                {...props}
                icon={
                  selectedProfession === profession.id
                    ? "check-circle"
                    : "circle-outline"
                }
              />
            )}
          />
        ))}
      </ScrollView>

      <Button
        mode="contained"
        onPress={handleContinue}
        loading={loading}
        disabled={!selectedProfession || loading}
        style={styles.button}
      >
        Continue
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.7,
  },
  list: {
    flex: 1,
  },
  button: {
    marginTop: 20,
  },
});
