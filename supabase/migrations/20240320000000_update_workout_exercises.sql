-- Update workout_exercises table
ALTER TABLE workout_exercises
ADD COLUMN IF NOT EXISTS target_areas text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipment_needed text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_work_friendly boolean DEFAULT false;

-- Make sets and reps nullable
ALTER TABLE workout_exercises 
ALTER COLUMN sets DROP NOT NULL,
ALTER COLUMN reps DROP NOT NULL;

-- Update existing records
UPDATE workout_exercises
SET 
  target_areas = '{}',
  equipment_needed = '{}',
  is_work_friendly = false
WHERE target_areas IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id 
ON workout_exercises(workout_id);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_completed 
ON workout_exercises(completed); 