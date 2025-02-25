import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Text, Card, Button, TextInput, Surface } from "react-native-paper";
import { useAITrainer } from "../../../contexts/AITrainerContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useWorkout } from "../../../contexts/WorkoutContext";
import { WorkoutPlan } from "../../../types/workouts";

export default function AITrainer() {
  const { session } = useAuth();
  const {
    getWorkoutRecommendation,
    getMotivationalMessage,
    safeGenerateAIResponse,
  } = useAITrainer();
  const { createWorkout } = useWorkout();
  const [loading, setLoading] = useState(false);
  const [tipOfTheDay, setTipOfTheDay] = useState("");
  const [userQuestion, setUserQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutPlan | null>(
    null
  );

  useEffect(() => {
    if (session?.user) {
      loadDailyTip();
    }
  }, [session]);

  const loadDailyTip = async () => {
    try {
      setLoading(true);
      const response = await getMotivationalMessage();
      setTipOfTheDay(response.content);
    } catch (error) {
      console.error("Error loading tip:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) return;

    try {
      setLoading(true);
      const response = await safeGenerateAIResponse(userQuestion);
      if (response) {
        setAiResponse(response.content);
        if (response.workoutPlan) {
          setCurrentWorkout(response.workoutPlan);
        } else {
          setCurrentWorkout(null);
        }
      }
      setUserQuestion("");
    } catch (error) {
      console.error("Error getting response:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWorkouts = async () => {
    if (!currentWorkout) return;

    try {
      setLoading(true);
      await createWorkout(currentWorkout);
      // Show success message
      alert("Workout added successfully!");
      setCurrentWorkout(null);
    } catch (error) {
      console.error("Error adding workout:", error);
      alert("Failed to add workout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="titleLarge">Your AI Trainer</Text>
        </Surface>

        <Card style={styles.card}>
          <Card.Title title="Tip of the Day" />
          <Card.Content>
            <Text variant="bodyLarge" style={styles.tip}>
              {tipOfTheDay || "Loading..."}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Ask Your Trainer" />
          <Card.Content>
            <TextInput
              placeholder="Ask about exercises or request a workout plan..."
              value={userQuestion}
              onChangeText={setUserQuestion}
              multiline
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleAskQuestion}
              loading={loading}
              style={styles.button}
              disabled={!userQuestion.trim() || loading}
            >
              Ask
            </Button>
            {aiResponse && (
              <>
                <Text style={styles.response}>{aiResponse}</Text>
                {currentWorkout && (
                  <Button
                    mode="contained"
                    onPress={handleAddToWorkouts}
                    style={styles.addButton}
                    icon="plus"
                  >
                    Add to Workouts
                  </Button>
                )}
              </>
            )}
          </Card.Content>
        </Card>
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
  card: {
    margin: 15,
    marginTop: 10,
  },
  tip: {
    textAlign: "center",
    fontStyle: "italic",
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginBottom: 10,
  },
  response: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  addButton: {
    marginTop: 10,
  },
});
