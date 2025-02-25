import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Text, List, RadioButton } from "react-native-paper";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import { PROFESSIONS } from "../../../data/professions";

const AVAILABLE_PROFESSIONS = [
  {
    name: "Office Worker",
    category: "Desk Work",
  },
  {
    name: "Doctor",
    category: "Healthcare",
  },
  {
    name: "Teacher",
    category: "Education",
  },
  {
    name: "Construction Worker",
    category: "Construction",
  },
  {
    name: "Software Developer",
    category: "Technology",
  },
  {
    name: "Nurse",
    category: "Healthcare",
  },
  {
    name: "Chef",
    category: "Food Service",
  },
  {
    name: "Retail Worker",
    category: "Retail",
  },
];

export default function ProfessionSelect() {
  const [selectedProfession, setSelectedProfession] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { session } = useAuth();

  const handleContinue = async () => {
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
      router.push("/profile/details");
    } catch (error) {
      console.error("Error saving profession:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Select Your Profession
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Choose the profession that best matches your role
      </Text>

      <ScrollView style={styles.list}>
        <RadioButton.Group
          onValueChange={(value) => setSelectedProfession(value)}
          value={selectedProfession}
        >
          {AVAILABLE_PROFESSIONS.map((profession) => (
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
  listItem: {
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "white",
  },
  selectedItem: {
    backgroundColor: "#e8f5e9",
  },
  button: {
    marginTop: 20,
  },
});
