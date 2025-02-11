import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import {
  Button,
  Text,
  Card,
  Surface,
  Searchbar,
  Snackbar,
} from "react-native-paper";
import { useAuth } from "../../../contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import { useWorkout } from "../../../contexts/WorkoutContext";

type UserProfile = {
  name: string;
  profession: string;
  fitness_level: string;
};

type ActiveWorkout = {
  id: string;
  created_at: string;
  completed: boolean;
  exercises: {
    total: number;
    completed: number;
  };
};

type UserStats = {
  totalWorkouts: number;
  totalMinutes: number;
  currentStreak: number;
};

export default function Home() {
  const { signOut, session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<UserStats>({
    totalWorkouts: 0,
    totalMinutes: 0,
    currentStreak: 0,
  });
  const router = useRouter();
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { triggerRefresh } = useWorkout();

  useFocusEffect(
    useCallback(() => {
      if (session?.user) {
        loadUserProfile();
      }
    }, [session])
  );

  useEffect(() => {
    if (session?.user) {
      Promise.all([
        loadUserProfile(),
        loadActiveWorkout(),
        loadUserStats(),
      ]).finally(() => setLoading(false));
    }
  }, [session]);

  const loadUserProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("id", session?.user.id)
        .single();

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          `
          fitness_level,
          professions:profession_id (
            name
          )
        `
        )
        .eq("id", session?.user.id)
        .single();

      if (userError) throw userError;

      setProfile({
        name: profileData?.full_name || "User",
        profession: userData?.professions?.name || "Not set",
        fitness_level: userData?.fitness_level || "Not set",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadActiveWorkout = async () => {
    try {
      const { data: workout, error } = await supabase
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
              name
            )
          )
        `
        )
        .eq("user_id", session?.user.id)
        .eq("completed", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (workout) {
        setActiveWorkout({
          id: workout.id,
          created_at: workout.created_at,
          completed: workout.completed,
          exercises: {
            total: workout.workout_exercises.length,
            completed: workout.workout_exercises.filter((e) => e.completed)
              .length,
          },
        });
      }
    } catch (error) {
      console.error("Error loading active workout:", error);
    }
  };

  const loadUserStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("user_progress")
        .select("workouts_completed, xp_earned, streak_count")
        .eq("user_id", session?.user.id)
        .eq("date", today)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      setStats({
        totalWorkouts: data?.workouts_completed || 0,
        totalMinutes: data?.xp_earned || 0,
        currentStreak: data?.streak_count || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const addExerciseToSession = async (exerciseName: string) => {
    if (!session?.user) return;

    try {
      // Create a UTC date at midnight for consistent comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      console.log("Adding exercise for date:", todayISO);

      const { data: existingWorkout } = await supabase
        .from("workouts")
        .select(
          `
          id, 
          workout_exercises (
            exercise_id,
            exercise:exercises (
              id,
              name
            )
          )
        `
        )
        .eq("user_id", session.user.id)
        .gte("created_at", todayISO)
        .lt(
          "created_at",
          new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        )
        .eq("completed", false)
        .single();

      console.log("Existing workout:", existingWorkout);

      let workoutId;

      if (!existingWorkout) {
        // Create new workout
        const { data: newWorkout, error: workoutError } = await supabase
          .from("workouts")
          .insert({
            user_id: session.user.id,
            type: "quick",
            completed: false,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (workoutError) throw workoutError;
        workoutId = newWorkout.id;
        console.log("Created new workout:", newWorkout);
      } else {
        workoutId = existingWorkout.id;
      }

      // Get exercise ID
      const { data: exercise, error: exerciseError } = await supabase
        .from("exercises")
        .select("id, name")
        .eq("name", exerciseName)
        .single();

      if (exerciseError) throw exerciseError;
      console.log("Found exercise:", exercise);

      // Add exercise to workout
      const { data: newWorkoutExercise, error: addError } = await supabase
        .from("workout_exercises")
        .insert({
          workout_id: workoutId,
          exercise_id: exercise.id,
          completed: false,
        })
        .select()
        .single();

      if (addError) throw addError;
      console.log("Added workout exercise:", newWorkoutExercise);

      setSnackbarMessage("Exercise added successfully!");
      setShowSnackbar(true);
      triggerRefresh();
    } catch (error) {
      console.error("Error adding exercise:", error);
      setSnackbarMessage("Failed to add exercise. Please try again.");
      setShowSnackbar(true);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Surface style={styles.header} elevation={1}>
          <View style={styles.headerContent}>
            <View>
              <Text variant="headlineSmall" style={styles.welcomeText}>
                Welcome Back!
              </Text>
              <Text variant="bodyLarge" style={styles.profession}>
                {profile?.name}
              </Text>
            </View>
          </View>
        </Surface>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Card style={styles.card}>
            <Card.Title title="Find Exercises" />
            <Card.Content>
              <Searchbar
                placeholder="Search exercises..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
              />
              <Button
                mode="contained"
                onPress={() => router.push("/(app)/workout/create")}
                style={styles.button}
              >
                Browse All Exercises
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Your Progress" />
            <Card.Content>
              <View style={styles.statsContainer}>
                <View style={styles.stat}>
                  <Text variant="titleLarge">{stats.totalWorkouts}</Text>
                  <Text variant="bodyMedium">Workouts</Text>
                </View>
                <View style={styles.stat}>
                  <Text variant="titleLarge">{stats.totalMinutes}</Text>
                  <Text variant="bodyMedium">Minutes</Text>
                </View>
                <View style={styles.stat}>
                  <Text variant="titleLarge">{stats.currentStreak}</Text>
                  <Text variant="bodyMedium">Streak</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Quick Exercises" />
            <Card.Content>
              <Text variant="bodyMedium">
                Take a break with these quick exercises:
              </Text>
              <View style={styles.quickExercises}>
                <Button
                  mode="outlined"
                  onPress={() => addExerciseToSession("Desk Stretches")}
                  style={styles.exerciseButton}
                >
                  Add Desk Stretches
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => addExerciseToSession("Eye Relief Exercises")}
                  style={styles.exerciseButton}
                >
                  Add Eye Relief
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => addExerciseToSession("Posture Correction")}
                  style={styles.exerciseButton}
                >
                  Add Posture Fix
                </Button>
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="outlined"
            onPress={signOut}
            style={styles.signOutButton}
          >
            Sign Out
          </Button>
        </ScrollView>
      </SafeAreaView>
      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    width: "100%",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "600",
  },
  profession: {
    opacity: 0.7,
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 15,
    paddingBottom: 20,
  },
  card: {
    marginHorizontal: 15,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  stat: {
    alignItems: "center",
  },
  quickExercises: {
    marginTop: 10,
    gap: 10,
  },
  exerciseButton: {
    marginVertical: 5,
  },
  button: {
    marginTop: 10,
  },
  signOutButton: {
    margin: 15,
    marginTop: 0,
  },
  searchBar: {
    marginBottom: 10,
  },
});
