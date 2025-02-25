import React, { createContext, useContext, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { Workout } from "../types/database";
import { WorkoutPlan } from "../types/workouts";

type WorkoutContextType = {
  refreshWorkMode: () => void;
  triggerRefresh: () => void;
  createWorkout: (workoutPlan: WorkoutPlan) => Promise<Workout>;
};

// Create a default implementation that throws a more descriptive error
const defaultCreateWorkout = async (): Promise<Workout> => {
  throw new Error(
    "WorkoutContext not initialized. Make sure WorkoutProvider is in your component tree."
  );
};

export const WorkoutContext = createContext<WorkoutContextType>({
  refreshWorkMode: () => {},
  triggerRefresh: () => {},
  createWorkout: defaultCreateWorkout,
});

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { session } = useAuth();

  const createWorkout = async (workoutPlan: WorkoutPlan): Promise<Workout> => {
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      // Create the workout
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert([
          {
            user_id: session.user.id,
            title: workoutPlan.title,
            type: workoutPlan.type,
            completed: false,
          },
        ])
        .select("*")
        .single();

      if (workoutError || !workout)
        throw workoutError || new Error("No workout created");

      // Create the workout exercises with only the fields that exist in the database
      const workoutExercises = workoutPlan.exercises.map((exercise) => ({
        workout_id: workout.id,
        name: exercise.name,
        description: exercise.description,
        sets: exercise.sets,
        reps: exercise.reps,
        duration_minutes: exercise.duration_minutes,
        target_areas: exercise.target_areas || [],
        equipment_needed: exercise.equipment_needed || [],
        is_work_friendly: exercise.is_work_friendly,
        completed: false,
      }));

      const { data: exercises, error: exercisesError } = await supabase
        .from("workout_exercises")
        .insert(workoutExercises)
        .select("*");

      if (exercisesError || !exercises) {
        throw exercisesError || new Error("No exercises created");
      }

      return {
        ...workout,
        workout_exercises: exercises,
      };
    } catch (error) {
      console.error("Error creating workout:", error);
      throw error;
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        refreshWorkMode: () => setRefreshKey((prev) => prev + 1),
        triggerRefresh: () => setRefreshKey((prev) => prev + 1),
        createWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

// Add error handling to the hook
export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
};
