import { View, StyleSheet } from "react-native";
import { Button, Text, SegmentedButtons } from "react-native-paper";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";

export default function ProfileDetails() {
  const [ageRange, setAgeRange] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { session } = useAuth();

  const handleContinue = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("users")
        .update({
          age_range: ageRange || null,
          fitness_level: fitnessLevel || null,
        })
        .eq("id", session.user.id);

      if (error) throw error;
      router.push("/(auth)/profile/schedule");
    } catch (error) {
      console.error("Error saving details:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.label}>
          Age Range (Optional)
        </Text>
        <SegmentedButtons
          value={ageRange}
          onValueChange={setAgeRange}
          buttons={[
            { value: "18-30", label: "18-30" },
            { value: "31-50", label: "31-50" },
            { value: "51+", label: "51+" },
          ]}
        />
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.label}>
          Fitness Level (Optional)
        </Text>
        <SegmentedButtons
          value={fitnessLevel}
          onValueChange={setFitnessLevel}
          buttons={[
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "advanced", label: "Advanced" },
          ]}
        />
      </View>

      <Button mode="contained" onPress={handleContinue} style={styles.button}>
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
  section: {
    marginBottom: 30,
  },
  label: {
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
  },
});
