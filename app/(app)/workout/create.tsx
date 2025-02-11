import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Text, Card, Chip, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";

type Exercise = {
  id: string;
  name: string;
  description: string;
  duration: string;
  duration_minutes: number;
  difficulty_level: string;
  target_areas: string[];
};

export default function CreateWorkout() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name");

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const addExercise = (exercise: Exercise) => {
    setSelectedExercises((prev) => {
      // Check if already added
      if (prev.some((e) => e.id === exercise.id)) {
        return prev.filter((e) => e.id !== exercise.id);
      }
      // Add to selected exercises
      return [...prev, exercise];
    });
  };

  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateWorkout = async () => {
    if (!selectedExercises.length || !session?.user) return;

    try {
      setLoading(true);

      // First create the workout
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert([
          {
            user_id: session.user.id,
            type: "custom",
            completed: false,
          },
        ])
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Then create workout exercises
      const workoutExercises = selectedExercises.map((exercise) => ({
        workout_id: workout.id,
        exercise_id: exercise.id,
        sets: 3, // Default values
        reps: 10,
        completed: false,
      }));

      const { error: exercisesError } = await supabase
        .from("workout_exercises")
        .insert(workoutExercises);

      if (exercisesError) throw exercisesError;

      // Navigate to the workout details screen
      router.replace(`/(app)/workout/${workout.id}`);
    } catch (error) {
      console.error("Error creating workout:", error);
      alert("Failed to create workout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search exercises..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />

      <ScrollView style={styles.exerciseList}>
        {filteredExercises.map((exercise) => (
          <Card
            key={exercise.id}
            style={[
              styles.exerciseCard,
              selectedExercises.some((e) => e.id === exercise.id) &&
                styles.selectedCard,
            ]}
          >
            <Card.Title title={exercise.name} />
            <Card.Content>
              <Text variant="bodyMedium">{exercise.description}</Text>
              <View style={styles.tags}>
                <Chip icon="clock">{exercise.duration}</Chip>
                <Chip icon="weight-lifter">{exercise.difficulty_level}</Chip>
              </View>
              <View style={styles.tags}>
                {exercise.target_areas.map((area) => (
                  <Chip key={area} icon="target">
                    {area}
                  </Chip>
                ))}
              </View>
              <Button
                mode={
                  selectedExercises.some((e) => e.id === exercise.id)
                    ? "outlined"
                    : "contained"
                }
                onPress={() => addExercise(exercise)}
                style={styles.addButton}
              >
                {selectedExercises.some((e) => e.id === exercise.id)
                  ? "Remove"
                  : "Add"}
              </Button>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text variant="bodyMedium">
          Selected: {selectedExercises.length} exercises
        </Text>
        <Button
          mode="contained"
          onPress={handleCreateWorkout}
          disabled={selectedExercises.length === 0}
          loading={loading}
        >
          Create Workout
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchInput: {
    margin: 15,
    backgroundColor: "white",
  },
  exerciseList: {
    flex: 1,
    padding: 15,
  },
  exerciseCard: {
    marginBottom: 10,
  },
  selectedCard: {
    backgroundColor: "#e3f2fd",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  footer: {
    padding: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 10,
  },
  addButton: {
    marginTop: 10,
  },
});
