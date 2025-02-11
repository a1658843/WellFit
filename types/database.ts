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
  profession_id: string;
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

export type Exercise = {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  difficulty_level?: string;
  target_areas: string[];
  video_url?: string;
  is_micro_workout: boolean;
};

export type Workout = {
  id: string;
  user_id: string;
  created_at: string;
  type: 'micro' | 'full';
  completed: boolean;
  feedback?: string;
};

export type WorkoutExercise = {
  workout_id: string;
  exercise_id: string;
  sets?: number;
  reps?: number;
  completed: boolean;
};

export type UserProgress = {
  id: string;
  user_id: string;
  date: string;
  xp_earned: number;
  workouts_completed: number;
  streak_count: number;
}; 