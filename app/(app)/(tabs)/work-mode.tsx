// New tab for Work Mode with profession-based exercises
// Include:
// - Timer for shift-based exercises
// - Exercise recommendations
// - Quick logging

import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import {
  Text,
  Surface,
  Button,
  Card,
  ProgressBar,
  List,
  IconButton,
  Divider,
  TouchableRipple,
} from "react-native-paper";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { Workout } from "../../../types/database";
import { ProfessionData } from "../../../data/professions";
import { useAITrainer } from "../../../contexts/AITrainerContext";
import { supabase } from "../../../lib/supabase";

// Add type definitions for profession-specific exercises
type ProfessionExercise = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  reason: string;
  recommended_frequency: string;
  target_areas: string[];
};

export default function WorkModeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { getFeedbackForProfession, isLoading, error, clearError } =
    useAITrainer();
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [workSchedule, setWorkSchedule] = useState<{
    start: string;
    end: string;
    days: number[];
  } | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>("");
  const [nextExercise, setNextExercise] = useState<string>("");
  const [breaksTaken, setBreaksTaken] = useState(0);
  const [activeMinutes, setActiveMinutes] = useState(0);
  const [todaysExercises, setTodaysExercises] = useState<string[]>([]);
  const [userProfession, setUserProfession] = useState<string>("");
  const [professionExercises, setProfessionExercises] = useState<
    ProfessionExercise[]
  >([]);
  const [professionIssues, setProfessionIssues] = useState<any[]>([]);
  const [professionData, setProfessionData] = useState<ProfessionData | null>({
    name: "",
    category: "",
    physical_demands: [],
    workplace_environment: "",
    common_issues: [],
    recommended_exercises: [],
  });
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    if (session?.user) {
      loadUserProfession();
      loadWorkSchedule();
      loadTodaysProgress();
      loadProfessionFeedback();
    }
  }, [session]);

  const loadUserProfession = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("profession_data")
        .eq("id", session?.user?.id)
        .single();

      if (error) throw error;

      if (data?.profession_data) {
        setProfessionData(data.profession_data);
        setUserProfession(data.profession_data.name);

        if (data.profession_data.recommended_exercises) {
          setProfessionExercises(
            data.profession_data.recommended_exercises.map((exercise) => ({
              id: exercise.name,
              name: exercise.name,
              description: exercise.description,
              duration_minutes: parseInt(exercise.duration) || 5,
              reason: exercise.description,
              recommended_frequency: exercise.frequency,
              target_areas: exercise.target_areas || [],
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error loading profession:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkSchedule = async () => {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("work_schedule")
        .eq("id", session?.user?.id)
        .single();

      if (error) throw error;
      setWorkSchedule(user?.work_schedule);
    } catch (error) {
      console.error("Error loading work schedule:", error);
    }
  };

  const loadActiveWorkout = async () => {
    try {
      const { data, error } = await supabase
        .from("workouts")
        .select(
          `
          *,
          workout_exercises (
            id,
            name,
            description,
            duration_minutes,
            completed
          )
        `
        )
        .eq("user_id", session?.user?.id)
        .eq("type", "work")
        .eq("completed", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveWorkout(data);
    } catch (error) {
      console.error("Error loading active workout:", error);
    } finally {
      setLoading(false);
    }
  };

  const isWorkingHours = () => {
    if (!workSchedule) return false;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toLocaleTimeString("en-US", { hour12: false });

    return (
      workSchedule.days.includes(currentDay) &&
      currentTime >= workSchedule.start &&
      currentTime <= workSchedule.end
    );
  };

  const createWorkModeWorkout = async () => {
    try {
      setLoading(true);

      // Create a work session
      const { data: session, error: sessionError } = await supabase
        .from("work_sessions")
        .insert([{ user_id: session?.user?.id }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create a work mode workout
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert([
          {
            user_id: session?.user?.id,
            title: `Work Session ${new Date().toLocaleDateString()}`,
            type: "work",
            completed: false,
          },
        ])
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Add some default work-friendly exercises
      const exercises = [
        {
          name: "Desk Stretches",
          description: "Simple stretches you can do at your desk",
          duration_minutes: 5,
          is_work_friendly: true,
          target_areas: ["back", "neck"],
          completed: false,
        },
        {
          name: "Standing Breaks",
          description: "Stand up and walk around for a few minutes",
          duration_minutes: 5,
          is_work_friendly: true,
          target_areas: ["legs", "circulation"],
          completed: false,
        },
      ];

      const { error: exercisesError } = await supabase
        .from("workout_exercises")
        .insert(
          exercises.map((ex) => ({
            ...ex,
            workout_id: workout.id,
          }))
        );

      if (exercisesError) throw exercisesError;

      // Navigate to the workout
      router.push(`/workout/${workout.id}`);
    } catch (error) {
      console.error("Error creating work session:", error);
      alert("Failed to start work session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate time until next exercise break
  const updateTimeUntilNext = () => {
    if (!workSchedule) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Schedule breaks every 2 hours during work hours
    const workStart = parseInt(workSchedule.start.split(":")[0]);
    const workEnd = parseInt(workSchedule.end.split(":")[0]);

    let nextBreakHour = workStart;
    while (nextBreakHour <= workEnd) {
      if (
        nextBreakHour > currentHour ||
        (nextBreakHour === currentHour && 0 > currentMinute)
      ) {
        break;
      }
      nextBreakHour += 2;
    }

    if (nextBreakHour <= workEnd) {
      const minutesUntil = (nextBreakHour - currentHour) * 60 - currentMinute;
      setTimeUntilNext(
        `${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m`
      );
      setNextExercise(getNextExercise(nextBreakHour));
    } else {
      setTimeUntilNext("Done for today");
      setNextExercise("");
    }
  };

  const getNextExercise = (hour: number) => {
    const exercises = [
      "Desk Stretches",
      "Standing Break",
      "Eye Relief",
      "Posture Check",
    ];
    return exercises[hour % exercises.length];
  };

  // Add function to start a quick exercise
  const startQuickExercise = async (exerciseName: string) => {
    try {
      setLoading(true);

      // Create a new workout if needed
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert([
          {
            user_id: session?.user?.id,
            title: `Quick Exercise - ${new Date().toLocaleTimeString()}`,
            type: "work",
            completed: false,
          },
        ])
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Add the exercise
      const { error: exerciseError } = await supabase
        .from("workout_exercises")
        .insert([
          {
            workout_id: workout.id,
            name: exerciseName,
            description: `Quick ${exerciseName.toLowerCase()} break`,
            duration_minutes: exerciseName === "Standing Break" ? 5 : 2,
            completed: false,
          },
        ]);

      if (exerciseError) throw exerciseError;

      // Update local state
      setBreaksTaken((prev) => prev + 1);
      setActiveMinutes(
        (prev) => prev + (exerciseName === "Standing Break" ? 5 : 2)
      );
      setTodaysExercises((prev) => [...prev, exerciseName]);

      // Navigate to the exercise
      router.push(`/workout/${workout.id}`);
    } catch (error) {
      console.error("Error starting quick exercise:", error);
      alert("Failed to start exercise. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load today's progress when component mounts
  useEffect(() => {
    if (session?.user) {
      loadTodaysProgress();
    }
  }, [session]);

  const loadTodaysProgress = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Get today's workouts
      const { data: workouts, error } = await supabase
        .from("workouts")
        .select(
          `
          id,
          workout_exercises (
            name,
            duration_minutes,
            completed
          )
        `
        )
        .eq("user_id", session?.user?.id)
        .eq("type", "work")
        .gte("created_at", today)
        .lt(
          "created_at",
          new Date(new Date().setDate(new Date().getDate() + 1)).toISOString()
        );

      if (error) throw error;

      // Calculate totals
      let breaks = 0;
      let minutes = 0;
      const exercises: string[] = [];

      workouts?.forEach((workout) => {
        workout.workout_exercises?.forEach((exercise) => {
          if (exercise.completed) {
            breaks++;
            minutes += exercise.duration_minutes || 0;
            exercises.push(exercise.name);
          }
        });
      });

      setBreaksTaken(breaks);
      setActiveMinutes(minutes);
      setTodaysExercises(exercises);
    } catch (error) {
      console.error("Error loading today's progress:", error);
    }
  };

  const loadProfessionFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("profession_data")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      if (data?.profession_data?.name) {
        const response = await getFeedbackForProfession(
          data.profession_data.name
        );
        setFeedback(response.content);
      }
    } catch (error) {
      console.error("Error loading profession feedback:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!professionData) {
    return (
      <View style={styles.container}>
        <Text>Please set your profession in profile settings</Text>
        <Button onPress={() => router.push("/profile/edit")}>
          Update Profile
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Card style={styles.statusCard}>
          <Card.Content>
            <Text variant="titleMedium">Work Mode</Text>
            {workSchedule ? (
              <>
                <Text variant="bodyMedium" style={styles.scheduleText}>
                  Working Hours: {workSchedule.start} - {workSchedule.end}
                </Text>
                <Text variant="bodyMedium" style={styles.nextBreak}>
                  Next Break: {timeUntilNext}
                  {nextExercise && ` - ${nextExercise}`}
                </Text>
              </>
            ) : (
              <Button
                mode="contained"
                onPress={() => router.push("/(app)/profile/edit")}
                style={styles.scheduleButton}
              >
                Set Work Schedule
              </Button>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.issuesCard}>
          <Card.Title title="Common Issues to Address" />
          <Card.Content>
            {professionData?.common_issues?.length > 0 ? (
              professionData.common_issues.map((issue, index) => (
                <Text key={index} style={styles.issueText}>
                  • {issue.issue} ({issue.severity} priority)
                </Text>
              ))
            ) : (
              <Text>No common issues identified for your profession.</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.exercisesCard}>
          <Card.Title
            title="Recommended Exercises"
            subtitle={`Based on ${userProfession || "your"} needs`}
          />
          <Card.Content>
            <View style={styles.exerciseList}>
              {professionExercises?.length > 0 ? (
                professionExercises.map((exercise) => (
                  <ExerciseItem
                    key={exercise.id}
                    title={exercise.name}
                    duration={`${exercise.duration_minutes} min`}
                    description={exercise.description}
                    reason={exercise.reason}
                    frequency={exercise.recommended_frequency}
                    onPress={() => startQuickExercise(exercise.name)}
                  />
                ))
              ) : (
                <Text>No exercises available for your profession yet.</Text>
              )}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Title title="Today's Progress" />
          <Card.Content>
            <Text>Breaks Taken: {breaksTaken}/4</Text>
            <Text>Active Minutes: {activeMinutes}</Text>
            <Text>Next Suggested Break: {nextExercise}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.feedbackCard}>
          <Card.Title title="Profession Feedback" />
          <Card.Content>
            {isLoading ? (
              <Text>Loading feedback...</Text>
            ) : (
              <Text>{feedback}</Text>
            )}
            {error && (
              <Text style={styles.errorText}>
                {error}
                <Button onPress={clearError}>Dismiss</Button>
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// Update ExerciseItem to include description
const ExerciseItem = ({
  title,
  duration,
  description,
  reason,
  frequency,
  onPress,
}) => (
  <Surface style={styles.exerciseItem}>
    <TouchableRipple onPress={onPress}>
      <View style={styles.exerciseContent}>
        <View style={styles.exerciseInfo}>
          <Text variant="titleMedium">{title}</Text>
          <Text variant="bodySmall" style={styles.description}>
            {description}
          </Text>
        </View>
        <Text variant="bodyMedium">{duration}</Text>
      </View>
    </TouchableRipple>
  </Surface>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
  },
  statusCard: {
    margin: 15,
    marginBottom: 10,
    backgroundColor: "#E8EAF6",
  },
  scheduleText: {
    marginTop: 10,
    opacity: 0.7,
  },
  statusText: {
    marginTop: 5,
    fontWeight: "bold",
  },
  activeStatus: {
    color: "#4CAF50",
    fontWeight: "bold",
    marginTop: 5,
  },
  inactiveStatus: {
    color: "#757575",
    marginTop: 5,
  },
  scheduleButton: {
    marginTop: 10,
  },
  workoutCard: {
    margin: 15,
    marginTop: 10,
  },
  emptyCard: {
    margin: 15,
    marginTop: 10,
    backgroundColor: "#FFF3E0",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 15,
  },
  createButton: {
    marginTop: 10,
  },
  continueButton: {
    marginTop: 15,
  },
  exercisesCard: {
    margin: 15,
    marginTop: 10,
  },
  exerciseList: {
    marginTop: 10,
    gap: 10,
  },
  exerciseItem: {
    borderRadius: 8,
    elevation: 2,
  },
  exerciseContent: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextBreak: {
    marginTop: 10,
    fontWeight: "bold",
  },
  statsCard: {
    margin: 15,
    marginTop: 10,
  },
  exerciseText: {
    marginBottom: 10,
  },
  exerciseInfo: {
    flex: 1,
    marginRight: 10,
  },
  description: {
    opacity: 0.7,
    marginTop: 4,
  },
  issuesCard: {
    margin: 15,
    marginTop: 10,
  },
  issueText: {
    marginBottom: 5,
  },
  feedbackCard: {
    margin: 15,
    marginTop: 10,
  },
  errorText: {
    color: "red",
    marginTop: 10,
  },
});
