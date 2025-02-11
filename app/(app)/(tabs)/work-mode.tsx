// New tab for Work Mode with profession-based exercises
// Include:
// - Timer for shift-based exercises
// - Exercise recommendations
// - Quick logging

import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Text, Surface, Button, Card, ProgressBar } from "react-native-paper";
import { useAuth } from "../../../contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, useFocusEffect } from "expo-router";
import { EventRegister } from "react-native-event-listeners";
import { useWorkout } from "../../../contexts/WorkoutContext";

type WorkSession = {
  start_time: string;
  end_time: string;
  completed_exercises: number;
  total_exercises: number;
};

// Add this type to track all exercises
type WorkoutExercise = {
  exercise: {
    id: string;
    name: string;
    duration: string;
    description: string;
  };
  completed: boolean;
};

export default function WorkMode() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workSchedule, setWorkSchedule] = useState<{
    start: string;
    end: string;
    days: string[];
  } | null>(null);
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(
    null
  );
  const [nextExercise, setNextExercise] = useState<{
    name: string;
    duration: string;
    description: string;
  } | null>(null);
  const [allExercises, setAllExercises] = useState<WorkoutExercise[]>([]);
  const { refreshWorkMode } = useWorkout();
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      if (session?.user) {
        Promise.all([loadWorkSchedule(), loadCurrentSession()]).finally(() =>
          setLoading(false)
        );
      }
    }, [session])
  );

  useEffect(() => {
    if (session?.user) {
      loadWorkSchedule();
    }
  }, [session]);

  // Replace the event listener with context
  useEffect(() => {
    if (session?.user) {
      loadCurrentSession();
    }
  }, [session, refreshWorkMode]);

  const loadWorkSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("work_schedule")
        .eq("id", session?.user.id)
        .single();

      if (error) throw error;
      setWorkSchedule(data?.work_schedule);
    } catch (error) {
      console.error("Error loading work schedule:", error);
    }
  };

  const loadCurrentSession = async () => {
    try {
      // Create a UTC date at midnight for consistent comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      console.log("Loading session for date:", todayISO);

      const { data: workouts, error } = await supabase
        .from("workouts")
        .select(
          `
          id,
          created_at,
          completed,
          workout_exercises (
            completed,
            exercise:exercises (
              id,
              name,
              duration,
              description
            )
          )
        `
        )
        .eq("user_id", session?.user.id)
        .gte("created_at", todayISO)
        .lt(
          "created_at",
          new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        )
        .order("created_at", { ascending: false });

      console.log("Loaded workouts:", workouts);

      if (error) throw error;

      if (!workouts || workouts.length === 0) {
        console.log("No workouts found for today");
        setCurrentSession({
          start_time: "9:00 AM",
          end_time: "5:00 PM",
          completed_exercises: 0,
          total_exercises: 0,
        });
        setNextExercise(null);
        setAllExercises([]);
        return;
      }

      // Combine all exercises from today's workouts
      const allExercises = workouts
        .flatMap((w) => w.workout_exercises)
        .map((we) => ({
          exercise: we.exercise,
          completed: we.completed,
        }));

      console.log("Processed exercises:", allExercises);

      // Calculate totals
      const totalExercises = allExercises.length;
      const completedExercises = allExercises.filter((e) => e.completed).length;

      console.log("Exercise counts:", {
        total: totalExercises,
        completed: completedExercises,
      });

      setCurrentSession({
        start_time: "9:00 AM",
        end_time: "5:00 PM",
        completed_exercises: completedExercises,
        total_exercises: totalExercises,
      });

      setAllExercises(allExercises);

      // Find next uncompleted exercise
      const nextIncomplete = allExercises.find((e) => !e.completed);
      if (nextIncomplete) {
        setNextExercise({
          name: nextIncomplete.exercise.name,
          duration: nextIncomplete.exercise.duration,
          description: nextIncomplete.exercise.description,
        });
      } else {
        setNextExercise(null);
      }
    } catch (error) {
      console.error("Error loading workout:", error);
    }
  };

  const loadNextExercise = async () => {
    // TODO: Implement AI-based exercise selection
    setNextExercise({
      name: "Desk Stretches",
      duration: "5 minutes",
      description: "Simple stretches to relieve tension",
    });
  };

  const handleStartExercise = async () => {
    try {
      // Get the exercise ID
      const { data: exercise, error } = await supabase
        .from("exercises")
        .select("id")
        .eq("name", nextExercise?.name)
        .single();

      if (error) throw error;

      // Navigate to exercise detail screen with workout ID
      router.push({
        pathname: `/workout/exercise-detail`,
        params: {
          id: exercise.id,
          workout_id: currentSession?.id,
        },
      });
    } catch (error) {
      console.error("Error starting exercise:", error);
      alert("Failed to start exercise. Please try again.");
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!session?.user) return;

    try {
      // Remove the exercise from the workout_exercises table
      const { error } = await supabase
        .from("workout_exercises")
        .delete()
        .eq("workout_id", currentSession?.id)
        .eq("exercise_id", exerciseId);

      if (error) throw error;

      // Update the local state to reflect the deletion
      setAllExercises((prev) =>
        prev.filter((ex) => ex.exercise.id !== exerciseId)
      );

      setSnackbarMessage("Exercise removed successfully!");
      setShowSnackbar(true);
    } catch (error) {
      console.error("Error deleting exercise:", error);
      setSnackbarMessage("Failed to remove exercise. Please try again.");
      setShowSnackbar(true);
    }
  };

  const renderExerciseList = () => {
    if (!allExercises.length) return null;

    return (
      <Card style={styles.card}>
        <Card.Title title="Today's Exercises" />
        <Card.Content>
          {allExercises.map((ex) => (
            <View key={ex.exercise.id} style={styles.exerciseItem}>
              <Text variant="bodyMedium">
                {ex.exercise.name} {ex.completed ? "✓" : ""}
              </Text>
              <Text variant="bodySmall" style={styles.exerciseDetail}>
                {ex.exercise.duration}
              </Text>
              <Button
                mode="outlined"
                onPress={() => handleDeleteExercise(ex.exercise.id)}
                style={styles.deleteButton}
              >
                Delete
              </Button>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading work mode...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineSmall">Work Session</Text>
          {currentSession && (
            <>
              <Text variant="bodyLarge" style={styles.time}>
                {currentSession.start_time} - {currentSession.end_time}
              </Text>
              <ProgressBar
                progress={
                  currentSession.total_exercises > 0
                    ? Math.round(
                        (currentSession.completed_exercises /
                          currentSession.total_exercises) *
                          100
                      ) / 100
                    : 0
                }
                style={styles.progress}
              />
              <Text variant="bodyMedium">
                {currentSession.completed_exercises} of{" "}
                {currentSession.total_exercises} exercises completed
              </Text>
            </>
          )}
        </Surface>

        {renderExerciseList()}

        {currentSession?.total_exercises > 0 && nextExercise && (
          <Card style={styles.card}>
            <Card.Title title="Next Exercise" />
            <Card.Content>
              <Text variant="titleMedium">{nextExercise.name}</Text>
              <Text variant="bodyMedium">{nextExercise.duration}</Text>
              <Text variant="bodyMedium" style={styles.description}>
                {nextExercise.description}
              </Text>
              <Button
                mode="contained"
                onPress={handleStartExercise}
                style={styles.button}
              >
                Start Exercise
              </Button>
            </Card.Content>
          </Card>
        )}

        {!workSchedule && (
          <Card style={styles.card}>
            <Card.Title title="Setup Required" />
            <Card.Content>
              <Text variant="bodyMedium">
                Please set up your work schedule to get personalized exercise
                recommendations.
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push("/(app)/profile/edit")}
                style={styles.button}
              >
                Set Up Schedule
              </Button>
            </Card.Content>
          </Card>
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
  header: {
    marginTop: 10,
    marginHorizontal: 15,
    padding: 20,
    backgroundColor: "white",
    alignItems: "center",
    borderRadius: 10,
  },
  time: {
    marginTop: 5,
    opacity: 0.7,
  },
  progress: {
    width: "100%",
    height: 8,
    marginVertical: 10,
  },
  card: {
    margin: 15,
    marginTop: 10,
  },
  description: {
    marginTop: 5,
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  quickExercises: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  exerciseButton: {
    marginVertical: 5,
  },
  nextExercise: {
    marginTop: 15,
    marginBottom: 10,
  },
  exerciseItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  exerciseDetail: {
    opacity: 0.7,
    marginTop: 4,
  },
  deleteButton: {
    marginTop: 5,
    backgroundColor: "#ff4d4d",
  },
});
