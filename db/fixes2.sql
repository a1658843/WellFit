-- First, identify and merge duplicate progress entries
WITH duplicates AS (
  SELECT user_id, date,
         SUM(workouts_completed) as total_workouts,
         SUM(xp_earned) as total_xp,
         MAX(streak_count) as max_streak,
         (array_agg(id ORDER BY id ASC))[1] as keep_id
  FROM user_progress
  GROUP BY user_id, date
  HAVING COUNT(*) > 1
),
deleted AS (
  DELETE FROM user_progress up
  USING duplicates d
  WHERE up.user_id = d.user_id 
    AND up.date = d.date 
    AND up.id != d.keep_id
  RETURNING up.*
)
UPDATE user_progress up
SET workouts_completed = d.total_workouts,
    xp_earned = d.total_xp,
    streak_count = d.max_streak
FROM duplicates d
WHERE up.id = d.keep_id;

-- Now add the unique constraint
ALTER TABLE user_progress 
  ADD CONSTRAINT user_progress_user_date_key 
  UNIQUE (user_id, date);

-- Update workout_exercises table structure
ALTER TABLE workout_exercises
  ADD COLUMN IF NOT EXISTS exercise_id uuid REFERENCES exercises(id),
  ADD COLUMN IF NOT EXISTS duration_minutes integer;

-- Add index for exercise lookups
CREATE INDEX IF NOT EXISTS workout_exercises_exercise_idx 
  ON workout_exercises(exercise_id);

-- Add composite unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS workout_exercises_workout_exercise_idx 
  ON workout_exercises(workout_id, exercise_id) 
  WHERE exercise_id IS NOT NULL;

-- Update existing workout_exercises to include exercise info
UPDATE workout_exercises we
SET exercise_id = e.id,
    duration_minutes = CASE 
      WHEN e.duration ~ '^\d+' 
      THEN CAST(substring(e.duration from '^\d+') as integer)
      ELSE NULL 
    END
FROM exercises e
WHERE we.name = e.name;

-- Add NOT NULL constraint after data migration if needed
-- ALTER TABLE workout_exercises ALTER COLUMN exercise_id SET NOT NULL; 