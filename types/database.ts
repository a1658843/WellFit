export type Profession = {
  id: string;
  name: string;
  category: string;
  health_risks: string[];
};

export type User = {
  id: string;
  email: string;
  created_at: string;
  profession_id?: string;
  profession_data?: {
    name: string;
    category: string;
    physical_demands: string[];
    workplace_environment: string;
    common_issues: Array<{ issue: string; severity: string }>;
    recommended_exercises: Array<{
      name: string;
      description: string;
      duration: string;
      frequency: string;
      target_areas: string[];
    }>;
  };
  profession_validated?: boolean;
  age_range?: string;
  fitness_level?: string;
  work_schedule?: {
    start: string;
    end: string;
    days: number[];
  };
  xp_points: number;
  subscription_status: 'free' | 'premium';
  subscription_end_date?: string;
};

export type WorkoutType = 'work' | 'exercise';

export type Workout = {
  id: string;
  user_id: string;
  title: string;
  type: "work" | "exercise";
  completed: boolean;
  created_at: string;
  workout_exercises: WorkoutExercise[];
};

export type Exercise = {
  id: string;
  name: string;
  description: string;
  duration_minutes?: number;
  sets?: number;
  reps?: number;
  equipment_needed?: string[];
  target_areas: string[];
  is_work_friendly: boolean;
};

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  name: string;
  description: string;
  sets?: number;
  reps?: number;
  duration_minutes?: number;
  completed: boolean;
  target_areas: string[];
  equipment_needed: string[];
  is_work_friendly: boolean;
};

export type UserProgress = {
  id: string;
  user_id: string;
  date: string;
  xp_earned: number;
  workouts_completed: number;
  streak_count: number;
};

export type WorkSession = {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  completed_exercises: number;
  total_exercises: number;
}; 