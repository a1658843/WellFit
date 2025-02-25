import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import {
  Button,
  Text,
  List,
  Checkbox,
  ProgressBar,
  Card,
  Divider,
  Snackbar,
  Surface as PaperSurface,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";

type WorkoutExercise = {
  id: string;
  name: string;
  description: string;
  sets: number;
  reps: number;
  duration_minutes?: number;
  completed: boolean;
};

type Workout = {
  id: string;
  title: string;
  created_at: string;
  completed: boolean;
  workout_exercises: WorkoutExercise[];
  type: string;
};

export default function WorkoutDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [canComplete, setCanComplete] = useState(false);

  useEffect(() => {
    if (session?.user && id) {
      loadWorkout();
    }
  }, [session, id]);

  const loadWorkout = async () => {
    try {
      const { data, error } = await supabase
        .from("workouts")
        .select(
          `
          id,
          title,
          created_at,
          completed,
          workout_exercises (
            id,
            name,
            description,
            sets,
            reps,
            duration_minutes,
            completed
          ),
          type
        `
        )
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        router.replace("/(app)/(tabs)");
        return;
      }

      setWorkout(data);
    } catch (error) {
      console.error("Error loading workout:", error);
      alert("Could not load workout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = async (index: number) => {
    if (!workout || workout.completed) return;

    try {
      const updatedExercises = [...workout.workout_exercises];
      const exercise = updatedExercises[index];
      const newCompletedState = !exercise.completed;

      // Update the exercise completion status
      const { error: exerciseError } = await supabase
        .from("workout_exercises")
        .update({ completed: newCompletedState })
        .eq("id", exercise.id);

      if (exerciseError) throw exerciseError;

      // Update local state
      exercise.completed = newCompletedState;
      setWorkout({
        ...workout,
        workout_exercises: updatedExercises,
      });

      // Check if all exercises are completed
      const allCompleted = updatedExercises.every((ex) => ex.completed);
      if (allCompleted) {
        // Update workout completion status
        const { error: workoutError } = await supabase
          .from("workouts")
          .update({ completed: true })
          .eq("id", workout.id);

        if (workoutError) throw workoutError;

        setWorkout({
          ...workout,
          completed: true,
        });
      }
    } catch (error) {
      console.error("Error toggling exercise:", error);
      alert("Failed to update exercise. Please try again.");
    }
  };

  const completeWorkout = async () => {
    if (isFinishing || !session?.user?.id) return;
    try {
      setIsFinishing(true);

      // Calculate total duration from actual exercise durations
      const totalMinutes = workout?.workout_exercises.reduce(
        (total, exercise) => total + (exercise.duration_minutes || 5), // Default to 5 minutes if not set
        0
      );

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // First update workout status
      const { error: workoutError } = await supabase
        .from("workouts")
        .update({ completed: true })
        .eq("id", workout.id);

      if (workoutError) throw workoutError;

      // Update user progress
      const { data: progress, error: progressError } = await supabase
        .from("user_progress")
        .select()
        .eq("user_id", session.user.id)
        .eq("date", today)
        .single();

      if (progressError && progressError.code !== "PGRST116")
        throw progressError;

      if (progress) {
        // Update existing progress
        const { error: updateError } = await supabase
          .from("user_progress")
          .update({
            workouts_completed: progress.workouts_completed + 1,
            xp_earned: progress.xp_earned + totalMinutes,
          })
          .eq("id", progress.id);

        if (updateError) throw updateError;
      } else {
        // Create new progress record
        const { error: insertError } = await supabase
          .from("user_progress")
          .insert([
            {
              user_id: session.user.id,
              date: today,
              workouts_completed: 1,
              xp_earned: totalMinutes,
              streak_count: 1,
            },
          ]);

        if (insertError) throw insertError;
      }

      // Show success message and navigate back
      setShowSnackbar(true);
      setTimeout(() => {
        router.replace("/(app)/(tabs)");
      }, 1500);
    } catch (error) {
      console.error("Error completing workout:", error);
      alert("Failed to complete workout. Please try again.");
    } finally {
      setIsFinishing(false);
    }
  };

  const updateStreak = async (userId: string) => {
    if (!userId) return;
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if user worked out yesterday
      const { data: yesterdayProgress } = await supabase
        .from("user_progress")
        .select("streak_count")
        .eq("user_id", userId)
        .eq("date", yesterday.toISOString().split("T")[0])
        .single();

      // Get today's progress
      const { data: todayProgress } = await supabase
        .from("user_progress")
        .select("id, streak_count")
        .eq("user_id", userId)
        .eq("date", today.toISOString().split("T")[0])
        .single();

      if (todayProgress) {
        const newStreak = yesterdayProgress
          ? yesterdayProgress.streak_count + 1
          : 1;

        await supabase
          .from("user_progress")
          .update({ streak_count: newStreak })
          .eq("id", todayProgress.id);
      }
    } catch (error) {
      console.error("Error updating streak:", error);
    }
  };

  // Add safety check for progress calculation
  const calculateProgress = () => {
    if (!workout?.workout_exercises?.length) return 0;
    const completed = workout.workout_exercises.filter(
      (ex) => ex.completed
    ).length;
    return completed / workout.workout_exercises.length;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading workout...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Workout not found</Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Title
            title={workout.title || "Workout"}
            subtitle={new Date(workout.created_at).toLocaleDateString()}
          />
          <Card.Content>
            {workout.completed && (
              <PaperSurface style={styles.completedBanner} elevation={1}>
                <Text style={styles.completedText}>Workout Completed! 🎉</Text>
              </PaperSurface>
            )}
            <Text variant="titleLarge" style={styles.title}>
              {workout?.title}
            </Text>

            {!workout?.completed && (
              <ProgressBar
                progress={calculateProgress()}
                style={styles.progressBar}
              />
            )}

            <List.Section>
              {workout?.workout_exercises?.map((exercise, index) => (
                <View key={exercise.id}>
                  <List.Item
                    title={`${index + 1}. ${exercise.name}`}
                    description={exercise.description}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={
                          exercise.completed ? "check-circle" : "circle-outline"
                        }
                      />
                    )}
                    onPress={() => !workout.completed && toggleExercise(index)}
                    style={[
                      styles.exerciseItem,
                      exercise.completed && styles.completedExercise,
                    ]}
                  />
                </View>
              ))}
            </List.Section>
          </Card.Content>
        </Card>
      </ScrollView>

      {!workout?.completed && (
        <Button
          mode="contained"
          onPress={completeWorkout}
          style={styles.finishButton}
          disabled={calculateProgress() < 1}
        >
          Finish Workout
        </Button>
      )}

      <Button
        mode="outlined"
        onPress={() => router.back()}
        style={styles.backButton}
      >
        Back to Workouts
      </Button>

      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={1500}
      >
        Workout completed successfully!
      </Snackbar>
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
  card: {
    margin: 15,
    marginTop: 10,
  },
  finishButton: {
    margin: 15,
    backgroundColor: "#4CAF50",
  },
  completedBanner: {
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
  },
  completedText: {
    color: "#2e7d32",
    fontWeight: "bold",
  },
  disabledItem: {
    opacity: 0.7,
  },
  backButton: {
    margin: 15,
    marginTop: 0,
  },
  exerciseItem: {
    paddingVertical: 8,
  },
  completedExercise: {
    opacity: 0.7,
    backgroundColor: "#f5f5f5",
  },
  disabledButton: {
    opacity: 0.5,
  },
  title: {
    marginBottom: 10,
  },
  progressBar: {
    marginBottom: 10,
  },
});
