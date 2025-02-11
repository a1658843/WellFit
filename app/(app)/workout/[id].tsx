import { View, StyleSheet, ScrollView } from "react-native";
import {
  Button,
  Text,
  List,
  Checkbox,
  ProgressBar,
  Card,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";

type WorkoutExercise = {
  exercise: {
    id: string;
    name: string;
    description: string;
    duration: string;
    duration_minutes: number;
  };
  sets: number;
  reps: number;
  completed: boolean;
};

export default function WorkoutDetails() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter();
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    loadWorkoutDetails();
  }, [id]);

  const loadWorkoutDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("workout_exercises")
        .select(
          `
          sets,
          reps,
          completed,
          exercise:exercises (
            id,
            name,
            description,
            duration,
            duration_minutes
          )
        `
        )
        .eq("workout_id", id);

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error("Error loading workout:", error);
      alert("Failed to load workout details");
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = async (index: number) => {
    try {
      const exercise = exercises[index];
      const updatedExercises = [...exercises];
      updatedExercises[index] = {
        ...exercise,
        completed: !exercise.completed,
      };

      const { error } = await supabase
        .from("workout_exercises")
        .update({ completed: !exercise.completed })
        .eq("workout_id", id)
        .eq("exercise_id", exercise.exercise.id);

      if (error) throw error;
      setExercises(updatedExercises);
    } catch (error) {
      console.error("Error updating exercise:", error);
    }
  };

  const completeWorkout = async () => {
    if (isFinishing || !session?.user?.id) return;
    try {
      setIsFinishing(true);

      // Calculate total duration from actual exercise durations
      const totalMinutes = exercises.reduce(
        (total, exercise) => total + (exercise.exercise.duration_minutes || 0),
        0
      );

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Update workout status first
      const { error: workoutError } = await supabase
        .from("workouts")
        .update({ completed: true })
        .eq("id", id);

      if (workoutError) throw workoutError;

      // Get or create progress record for today
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

      // Update user's streak
      await updateStreak(session.user.id);

      // Navigate back to home screen
      router.replace("/(app)");
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
    if (!exercises || exercises.length === 0) return 0;
    const completedCount = exercises.filter((e) => e.completed).length;
    // Round to 2 decimal places to avoid precision errors
    return Math.floor((completedCount / exercises.length) * 100) / 100;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading workout...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall">Workout Progress</Text>
        <ProgressBar
          progress={calculateProgress()}
          style={styles.progressBar}
        />
        <Text variant="bodyMedium">
          {Math.round(calculateProgress() * 100)}% Complete
        </Text>
      </View>

      <ScrollView style={styles.exerciseList}>
        {exercises.map((exercise, index) => (
          <Card key={exercise.exercise.id} style={styles.exerciseCard}>
            <Card.Title title={exercise.exercise.name} />
            <Card.Content>
              <Text variant="bodyMedium">{exercise.exercise.description}</Text>
              <Text variant="bodyMedium" style={styles.sets}>
                {exercise.sets} sets × {exercise.reps} reps
              </Text>
              <Button
                mode={exercise.completed ? "outlined" : "contained"}
                onPress={() => toggleExercise(index)}
                style={styles.completeButton}
              >
                {exercise.completed ? "Completed" : "Complete"}
              </Button>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Button
        mode="contained"
        onPress={completeWorkout}
        style={styles.finishButton}
        disabled={
          !calculateProgress() || calculateProgress() < 1 || isFinishing
        }
        loading={isFinishing}
      >
        {isFinishing ? "Finishing..." : "Finish Workout"}
      </Button>
    </View>
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
  header: {
    padding: 20,
    backgroundColor: "white",
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 8,
    marginVertical: 10,
  },
  exerciseList: {
    flex: 1,
    padding: 15,
  },
  exerciseCard: {
    marginBottom: 10,
  },
  sets: {
    marginTop: 5,
    opacity: 0.7,
  },
  completeButton: {
    marginTop: 10,
  },
  finishButton: {
    margin: 15,
  },
});
