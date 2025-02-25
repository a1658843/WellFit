-- Create function to handle workout completion
CREATE OR REPLACE FUNCTION handle_workout_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_minutes INTEGER;
  today DATE;
  all_exercises_completed BOOLEAN;
BEGIN
  -- Check if all exercises are completed
  SELECT COALESCE(bool_and(completed), TRUE)
  INTO all_exercises_completed
  FROM workout_exercises
  WHERE workout_id = NEW.id;

  -- Only proceed if all exercises are completed
  IF all_exercises_completed THEN
    -- Calculate total minutes for the workout
    SELECT COALESCE(SUM(duration_minutes), 0)
    INTO total_minutes
    FROM workout_exercises
    WHERE workout_id = NEW.id;

    -- Set default if no duration found
    IF total_minutes = 0 THEN
      total_minutes := 5 * (
        SELECT COUNT(*)
        FROM workout_exercises
        WHERE workout_id = NEW.id
      );
    END IF;

    today := CURRENT_DATE;

    -- Mark workout as completed
    NEW.completed := TRUE;

    -- Update or create progress record
    INSERT INTO user_progress (
      user_id,
      date,
      workouts_completed,
      xp_earned,
      streak_count
    )
    VALUES (
      NEW.user_id,
      today,
      1,
      total_minutes,
      1
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      workouts_completed = user_progress.workouts_completed + 1,
      xp_earned = user_progress.xp_earned + total_minutes;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS workout_completion_trigger ON workouts;
DROP TRIGGER IF EXISTS exercise_completion_trigger ON workout_exercises;

-- Create trigger for workout completion
CREATE TRIGGER workout_completion_trigger
  BEFORE UPDATE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION handle_workout_completion();

-- Create trigger for exercise completion
CREATE TRIGGER exercise_completion_trigger
  AFTER UPDATE ON workout_exercises
  FOR EACH ROW
  EXECUTE FUNCTION handle_workout_completion();

-- Add index to help with completion checks
CREATE INDEX IF NOT EXISTS workout_exercises_completion_idx 
  ON workout_exercises(workout_id, completed);

-- Update existing workouts that should be marked complete
UPDATE workouts w
SET completed = TRUE
WHERE NOT completed 
AND NOT EXISTS (
  SELECT 1 
  FROM workout_exercises we 
  WHERE we.workout_id = w.id 
  AND NOT we.completed
); 