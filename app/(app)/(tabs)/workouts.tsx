import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Button, Text, Card, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { Workout } from "../../../types/database";
import { generateWorkoutPlan } from "../../../lib/ai";

const tips = [
  "Tip: Add 'advanced' or 'beginner' to adjust workout difficulty",
  "Tip: Try combining muscle groups like 'chest and shoulders'",
  "Tip: Specify body parts like 'upper body' or 'core'",
  "Tip: Want specific focus? Try 'glutes', 'back', or 'abs'",
];

export default function WorkoutsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [currentTip, setCurrentTip] = useState(tips[0]);

  useEffect(() => {
    if (session?.user) {
      loadWorkouts();
    }
  }, [session]);

  const loadWorkouts = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: workoutIds, error: countError } = await supabase
        .from("workout_exercises")
        .select("workout_id")
        .not("workout_id", "is", null);

      if (countError) throw countError;

      const { data, error } = await supabase
        .from("workouts")
        .select(
          `
          *,
          workout_exercises (
            id,
            name,
            description,
            sets,
            reps,
            completed
          )
        `
        )
        .eq("user_id", session?.user?.id)
        .eq("type", "exercise")
        .in("id", workoutIds?.map((w) => w.workout_id) || [])
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const validWorkouts = (data || []).filter(
        (workout) =>
          workout.workout_exercises && workout.workout_exercises.length > 0
      );

      setWorkouts(validWorkouts);
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserInput = async () => {
    if (!userInput.trim()) return;

    try {
      setLoading(true);
      console.log("Generating workout plan for input:", userInput);
      const workoutPlan = await generateWorkoutPlan(userInput);
      console.log("Generated workout plan:", workoutPlan);

      if (workoutPlan) {
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        setCurrentTip(randomTip);

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

        if (workoutError || !workout) {
          console.error("Error inserting workout:", workoutError);
          throw workoutError;
        }

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

        if (exercisesError) {
          console.error("Error inserting exercises:", exercisesError);
          throw exercisesError;
        }

        loadWorkouts();
      }
    } catch (error) {
      console.error("Error generating workout:", error);
      setChatHistory((prev) => [
        ...prev,
        "AI: Failed to generate workout. Please try again.",
      ]);
    } finally {
      setLoading(false);
      setUserInput("");
    }
  };

  const calculateProgress = (workout: Workout) => {
    const total = workout.workout_exercises.length;
    const completed = workout.workout_exercises.filter(
      (e) => e.completed
    ).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const toggleExerciseDescription = (exerciseId: string) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      Alert.alert(
        "Delete Workout",
        "Are you sure you want to delete this workout?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setLoading(true);

              const { error: exercisesError } = await supabase
                .from("workout_exercises")
                .delete()
                .eq("workout_id", workoutId);

              if (exercisesError) {
                console.error("Error deleting exercises:", exercisesError);
                throw exercisesError;
              }

              const { error: workoutError } = await supabase
                .from("workouts")
                .delete()
                .eq("id", workoutId);

              if (workoutError) {
                console.error("Error deleting workout:", workoutError);
                throw workoutError;
              }

              loadWorkouts();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error in handleDeleteWorkout:", error);
      Alert.alert("Error", "Failed to delete workout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading workouts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.chatContainer}>
        <View style={styles.chatHistory}>
          <Text style={styles.tipMessage}>{currentTip}</Text>
        </View>
        <TextInput
          style={styles.chatInput}
          placeholder="Type your workout preferences..."
          value={userInput}
          onChangeText={setUserInput}
          onSubmitEditing={handleUserInput}
        />
        <Button
          mode="contained"
          onPress={handleUserInput}
          style={styles.sendButton}
          compact
        >
          Send
        </Button>
      </View>

      <ScrollView style={styles.container}>
        {workouts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>
                No workouts scheduled for today. Use the chat to create a new
                workout!
              </Text>
            </Card.Content>
          </Card>
        ) : (
          workouts.map((workout) => (
            <Card
              key={workout.id}
              style={[
                styles.workoutCard,
                workout.completed && styles.completedCard,
              ]}
            >
              <Card.Title
                title={workout.title || "Workout"}
                subtitle={`Progress: ${calculateProgress(workout)}%`}
                right={(props) => (
                  <IconButton
                    {...props}
                    icon="delete"
                    onPress={() => handleDeleteWorkout(workout.id)}
                  />
                )}
              />
              <Card.Content>
                <View style={styles.exerciseList}>
                  {workout.workout_exercises.map((exercise, index) => (
                    <TouchableOpacity
                      key={exercise.id}
                      style={styles.exerciseItem}
                      onPress={() => toggleExerciseDescription(exercise.id)}
                    >
                      <Text style={styles.exerciseNumber}>{index + 1}.</Text>
                      <View style={styles.exerciseDetails}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        {exercise.sets && exercise.reps && (
                          <Text style={styles.exerciseStats}>
                            {exercise.sets} sets × {exercise.reps} reps
                          </Text>
                        )}
                        {expandedExercise === exercise.id && (
                          <Text style={styles.exerciseDescription}>
                            {exercise.description}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={() => router.push(`/workout/${workout.id}`)}
                  disabled={workout.completed}
                >
                  {workout.completed ? "Completed" : "Continue Workout"}
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
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
  workoutCard: {
    margin: 15,
    marginBottom: 8,
  },
  completedCard: {
    opacity: 0.7,
    backgroundColor: "#F5F5F5",
  },
  emptyCard: {
    margin: 15,
    padding: 10,
    backgroundColor: "#FFF9C4",
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.7,
  },
  exerciseList: {
    marginTop: 10,
  },
  exerciseItem: {
    flexDirection: "row",
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  exerciseNumber: {
    marginRight: 8,
    fontWeight: "bold",
    minWidth: 25,
    fontSize: 16,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  exerciseStats: {
    opacity: 0.7,
    fontSize: 14,
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
    marginTop: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#ddd",
  },
  chatContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
  },
  chatHistory: {
    minHeight: 40,
    padding: 4,
    marginBottom: 8,
  },
  tipMessage: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },
  chatInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
    fontSize: 14,
  },
  sendButton: {
    marginTop: 0,
    marginBottom: 0,
  },
});
