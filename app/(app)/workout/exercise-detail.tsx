// Add:
// - Exercise benefits explanation
// - Video demonstrations
// - Profession-specific tips

import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import {
  Text,
  Surface,
  Button,
  Card,
  Chip,
  ProgressBar,
  Snackbar,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";

type ExerciseDetail = {
  id: string;
  name: string;
  description: string;
  duration: string;
  difficulty_level: string;
  target_areas: string[];
  video_url: string | null;
  benefits: string[];
  profession_tips: {
    [key: string]: string;
  };
};

export default function ExerciseDetail() {
  const { id, workout_id } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [userProfession, setUserProfession] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [canComplete, setCanComplete] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    if (session?.user) {
      Promise.all([loadExerciseDetails(), loadUserProfession()]).finally(() =>
        setLoading(false)
      );
    }
  }, [session, id]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setCanComplete(true);
    }
  }, [isActive, timeLeft]);

  const loadExerciseDetails = async () => {
    try {
      // TODO: Update this when we add the new fields to the exercises table
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Temporary mock data for new fields
      setExercise({
        ...data,
        benefits: [
          "Improves posture",
          "Reduces muscle tension",
          "Increases blood flow",
        ],
        profession_tips: {
          "Office Worker": "Do this every hour while sitting",
          Nurse: "Great between patient rounds",
          Chef: "Perfect during prep time",
        },
      });
    } catch (error) {
      console.error("Error loading exercise:", error);
    }
  };

  const loadUserProfession = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("professions:profession_id(name)")
        .eq("id", session?.user.id)
        .single();

      if (error) throw error;
      setUserProfession(data?.professions?.name || null);
    } catch (error) {
      console.error("Error loading profession:", error);
    }
  };

  const startExercise = () => {
    // Convert duration (e.g., "5 minutes") to seconds
    const minutes = parseInt(exercise?.duration?.split(" ")[0] || "5");
    setTimeLeft(minutes * 60);
    setIsActive(true);
  };

  const handleComplete = async () => {
    if (!session?.user?.id) return;

    try {
      // Record exercise completion
      const { error: progressError } = await supabase
        .from("user_progress")
        .insert({
          user_id: session.user.id,
          date: new Date().toISOString().split("T")[0],
          xp_earned: 10,
        });

      if (progressError) throw progressError;

      // Update the specific exercise's completion status
      const { error: workoutError } = await supabase
        .from("workout_exercises")
        .update({ completed: true })
        .eq("workout_id", workout_id)
        .eq("exercise_id", id);

      if (workoutError) throw workoutError;

      // Check if all exercises are completed
      const { data: workout, error: checkError } = await supabase
        .from("workouts")
        .select(
          `
          workout_exercises (
            completed
          )
        `
        )
        .eq("id", workout_id)
        .single();

      if (checkError) throw checkError;

      const allCompleted = workout.workout_exercises.every((e) => e.completed);

      if (allCompleted) {
        // Update workout as completed if all exercises are done
        const { error: updateError } = await supabase
          .from("workouts")
          .update({ completed: true })
          .eq("id", workout_id);

        if (updateError) throw updateError;
      }

      setCompleted(true);
      setShowSnackbar(true);

      // Wait for snackbar to show before navigating back
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error("Error completing exercise:", error);
      alert("Failed to save progress. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading exercise details...</Text>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Exercise not found</Text>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container}>
          <Surface style={styles.header} elevation={1}>
            <Text variant="headlineMedium">{exercise.name}</Text>
            <View style={styles.tags}>
              <Chip icon="clock">{exercise.duration}</Chip>
              <Chip icon="weight-lifter">{exercise.difficulty_level}</Chip>
            </View>
          </Surface>

          <Card style={styles.card}>
            <Card.Content style={styles.timerContent}>
              {!isActive && !canComplete ? (
                <Button mode="contained" onPress={startExercise}>
                  Start Timer
                </Button>
              ) : (
                <>
                  <Text variant="displaySmall">
                    {Math.floor(timeLeft / 60)}:
                    {(timeLeft % 60).toString().padStart(2, "0")}
                  </Text>
                  {isActive && (
                    <>
                      <ProgressBar
                        progress={
                          timeLeft === 0
                            ? 1
                            : Number(
                                (
                                  timeLeft /
                                  (parseInt(
                                    exercise.duration.split(" ")[0] || "5"
                                  ) *
                                    60)
                                ).toFixed(2)
                              )
                        }
                        style={styles.progress}
                      />
                      <Button
                        mode="outlined"
                        onPress={() => setCanComplete(true)}
                        style={styles.skipButton}
                      >
                        Complete Early
                      </Button>
                    </>
                  )}
                </>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Description" />
            <Card.Content>
              <Text variant="bodyMedium">{exercise.description}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Benefits" />
            <Card.Content>
              {exercise.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Text variant="bodyMedium">• {benefit}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>

          {userProfession && exercise.profession_tips[userProfession] && (
            <Card style={styles.card}>
              <Card.Title title="Professional Tip" />
              <Card.Content>
                <Text variant="bodyMedium">
                  {exercise.profession_tips[userProfession]}
                </Text>
              </Card.Content>
            </Card>
          )}

          {exercise.video_url && (
            <Card style={styles.card}>
              <Card.Title title="Video Demonstration" />
              <Card.Content>
                {/* TODO: Add video player component */}
                <Text variant="bodyMedium">Video coming soon...</Text>
              </Card.Content>
            </Card>
          )}

          {canComplete && !completed && (
            <Button
              mode="contained"
              onPress={handleComplete}
              style={styles.completeButton}
            >
              Complete Exercise
            </Button>
          )}

          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.button}
            disabled={isActive}
          >
            Back to Workout
          </Button>
        </ScrollView>
      </SafeAreaView>

      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={1500}
      >
        Exercise completed! Great job!
      </Snackbar>
    </>
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
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  card: {
    margin: 15,
    marginTop: 10,
  },
  benefitItem: {
    marginBottom: 5,
  },
  button: {
    margin: 15,
  },
  timerContent: {
    alignItems: "center",
    padding: 20,
  },
  progress: {
    width: "100%",
    height: 8,
    marginTop: 10,
  },
  skipButton: {
    marginTop: 15,
  },
  completeButton: {
    margin: 15,
    marginBottom: 0,
    backgroundColor: "#4CAF50",
  },
});
