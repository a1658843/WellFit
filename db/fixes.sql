-- Drop any existing foreign key constraints that might be causing issues
ALTER TABLE workout_exercises 
  DROP CONSTRAINT IF EXISTS workout_exercises_exercise_id_fkey;

-- Drop any existing indexes that might be outdated
DROP INDEX IF EXISTS workout_exercises_exercise_id_idx;

-- Add composite index for faster workout exercise lookups
CREATE INDEX IF NOT EXISTS workout_exercises_composite_idx 
  ON workout_exercises(workout_id, completed);

-- Add index for timestamp queries
CREATE INDEX IF NOT EXISTS workouts_created_completed_idx 
  ON workouts(created_at, completed);

-- Add index for user workouts by date
CREATE INDEX IF NOT EXISTS workouts_user_date_idx 
  ON workouts(user_id, created_at DESC);

-- Add index for progress date lookups
CREATE INDEX IF NOT EXISTS user_progress_date_idx 
  ON user_progress(user_id, date DESC);

-- Add constraint to ensure valid sets and reps
ALTER TABLE workout_exercises 
  ADD CONSTRAINT valid_sets_reps 
  CHECK (sets > 0 AND reps > 0);

-- Add constraint for valid dates
ALTER TABLE workouts 
  ADD CONSTRAINT valid_created_at 
  CHECK (created_at <= CURRENT_TIMESTAMP);

-- Add trigger to update user_progress when workout is completed
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND OLD.completed = false THEN
    INSERT INTO user_progress (user_id, date, workouts_completed)
    VALUES (NEW.user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET workouts_completed = user_progress.workouts_completed + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER workout_completed_trigger
  AFTER UPDATE ON workouts
  FOR EACH ROW
  WHEN (NEW.completed = true AND OLD.completed = false)
  EXECUTE FUNCTION update_user_progress();

-- Add function to calculate streak
CREATE OR REPLACE FUNCTION calculate_streak(user_uuid uuid)
RETURNS integer AS $$
DECLARE
  streak integer := 0;
  last_date date;
BEGIN
  -- Get the last consecutive date with a workout
  SELECT date
  FROM user_progress
  WHERE user_id = user_uuid
  AND workouts_completed > 0
  ORDER BY date DESC
  LIMIT 1
  INTO last_date;

  -- Count consecutive days
  WHILE EXISTS (
    SELECT 1
    FROM user_progress
    WHERE user_id = user_uuid
    AND date = last_date
    AND workouts_completed > 0
  ) LOOP
    streak := streak + 1;
    last_date := last_date - 1;
  END LOOP;

  RETURN streak;
END;
$$ LANGUAGE plpgsql;