import React, { useState } from "react";
import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Button, Text, Card, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAITrainer } from "../../../contexts/AITrainerContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../../lib/supabase";

export default function CreateWorkout() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const { session } = useAuth();
  const { generateWorkoutPlan } = useAITrainer();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const generatePromptTemplate = () => {
    if (type === "work") {
      return "I need some quick exercises I can do at my desk during work.";
    }
    return "I want a workout plan that includes: ";
  };

  const getPromptPlaceholder = () => {
    if (type === "work") {
      return "E.g., stretches for my back, exercises for wrist pain";
    }
    return "E.g., upper body focus, using dumbbells, 30 minutes";
  };

  const handleCreateWorkout = async () => {
    if (!prompt.trim()) return;

    try {
      setLoading(true);

      // Create a structured workout plan
      const workoutPlan = {
        title: type === "work" ? "Work Break Exercises" : "Exercise Workout",
        type: type as "work" | "exercise",
        exercises: [
          {
            name: "Upper Body Workout",
            description: "A series of upper body strengthening exercises",
            sets: 3,
            reps: 12,
            duration_minutes: type === "work" ? 5 : 30,
            target_areas: ["upper body"],
            is_work_friendly: type === "work",
            completed: false,
          },
        ],
      };

      // Create the workout in the database
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          user_id: session?.user?.id,
          title: workoutPlan.title,
          type: workoutPlan.type,
          completed: false,
        })
        .select()
        .single();

      if (workoutError || !workout) throw workoutError;

      // Add exercises to the workout
      const { error: exercisesError } = await supabase
        .from("workout_exercises")
        .insert(
          workoutPlan.exercises.map((exercise) => ({
            workout_id: workout.id,
            name: exercise.name,
            description: exercise.description,
            sets: exercise.sets,
            reps: exercise.reps,
            duration_minutes: exercise.duration_minutes,
            target_areas: exercise.target_areas,
            completed: false,
          }))
        );

      if (exercisesError) throw exercisesError;

      // Navigate to the workout
      router.replace(`/workout/${workout.id}`);
    } catch (error) {
      console.error("Error creating workout:", error);
      alert("Failed to create workout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">
              {type === "work" ? "Create Work Session" : "Create Workout Plan"}
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              {type === "work"
                ? "Describe what kind of exercises you'd like to do during work."
                : "Describe your workout preferences and I'll create a plan for you."}
            </Text>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder={getPromptPlaceholder()}
              value={prompt}
              onChangeText={setPrompt}
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleCreateWorkout}
              loading={loading}
              disabled={loading || !prompt.trim()}
              style={styles.button}
            >
              {loading ? "Creating..." : "Create Plan"}
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.tipsCard}>
          <Card.Content>
            <Text variant="titleSmall">Tips for better results:</Text>
            <Text style={styles.tip}>• Mention your fitness level</Text>
            <Text style={styles.tip}>• Specify available equipment</Text>
            <Text style={styles.tip}>• Include time constraints</Text>
            <Text style={styles.tip}>• Mention any focus areas</Text>
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
  card: {
    margin: 15,
  },
  description: {
    marginTop: 10,
    marginBottom: 15,
    opacity: 0.7,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  tipsCard: {
    margin: 15,
    marginTop: 0,
    backgroundColor: "#E3F2FD",
  },
  tip: {
    marginTop: 5,
    opacity: 0.7,
  },
});
