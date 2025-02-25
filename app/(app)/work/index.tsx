import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Button, Surface } from "react-native-paper";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "expo-router";
import React from "react";

type ProfessionData = {
  name: string;
  category: string;
  health_risks: string[];
  work_characteristics: {
    physical_demands: string[];
    workplace: string[];
    movements: string[];
  };
  common_issues: Array<{
    issue: string;
    severity: string;
  }>;
};

export default function WorkMode() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [professionData, setProfessionData] = useState<ProfessionData | null>(
    null
  );
  const [workMode, setWorkMode] = useState<"active" | "sedentary">("sedentary");

  useEffect(() => {
    loadProfessionData();
  }, []);

  const loadProfessionData = async () => {
    try {
      if (!session?.user?.id) return;

      // Get user's profession and work mode
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("profession_id, work_mode")
        .eq("id", session.user.id)
        .single();

      if (userError) throw userError;

      if (userData.work_mode) {
        setWorkMode(userData.work_mode);
      }

      if (userData.profession_id) {
        // Get profession details
        const { data: professionData, error: professionError } = await supabase
          .from("professions")
          .select("*")
          .eq("id", userData.profession_id)
          .single();

        if (professionError) throw professionError;
        setProfessionData(professionData);
      }
    } catch (error) {
      console.error("Error loading profession data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.content} elevation={1}>
        {professionData ? (
          <>
            <Text variant="headlineMedium" style={styles.title}>
              {professionData.name} - {workMode} Mode
            </Text>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Physical Demands</Text>
                <View style={styles.chipContainer}>
                  {professionData.work_characteristics.physical_demands.map(
                    (demand, index) => (
                      <Text key={index} style={styles.chip}>
                        {demand}
                      </Text>
                    )
                  )}
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Health Risks</Text>
                <View style={styles.chipContainer}>
                  {professionData.health_risks.map((risk, index) => (
                    <Text key={index} style={styles.chip}>
                      {risk}
                    </Text>
                  ))}
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Common Issues</Text>
                <View style={styles.chipContainer}>
                  {professionData.common_issues.map((issue, index) => (
                    <Text key={index} style={styles.chip}>
                      {issue.issue} ({issue.severity})
                    </Text>
                  ))}
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Workplace Characteristics</Text>
                <View style={styles.chipContainer}>
                  {professionData.work_characteristics.workplace.map(
                    (char, index) => (
                      <Text key={index} style={styles.chip}>
                        {char}
                      </Text>
                    )
                  )}
                </View>
              </Card.Content>
            </Card>
          </>
        ) : (
          <View style={styles.centered}>
            <Text variant="bodyLarge">No profession set</Text>
            <Button
              mode="contained"
              onPress={() => router.push("/profile/edit")}
              style={styles.button}
            >
              Set Your Profession
            </Button>
          </View>
        )}
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    marginBottom: 15,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  chip: {
    backgroundColor: "#e0e0e0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  button: {
    marginTop: 10,
  },
});
