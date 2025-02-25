-- Add missing columns and fix constraints
ALTER TABLE workout_exercises
ADD COLUMN IF NOT EXISTS duration_minutes integer,
ALTER COLUMN sets DROP NOT NULL,
ALTER COLUMN reps DROP NOT NULL,
ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workout_exercises_completion 
ON workout_exercises(workout_id, completed);

-- Update existing work mode exercises
UPDATE workout_exercises we
SET 
  duration_minutes = 5,
  sets = NULL,
  reps = NULL
FROM workouts w
WHERE we.workout_id = w.id AND w.type = 'work'; 