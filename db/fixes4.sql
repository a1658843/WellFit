-- Drop existing triggers and function
DROP TRIGGER IF EXISTS workout_completion_trigger ON workouts;
DROP TRIGGER IF EXISTS exercise_completion_trigger ON workout_exercises;
DROP FUNCTION IF EXISTS handle_workout_completion();

-- Create new function to handle exercise completion
CREATE OR REPLACE FUNCTION handle_exercise_completion()
RETURNS TRIGGER AS $$
DECLARE
  workout_record RECORD;
  all_completed BOOLEAN;
  total_minutes INTEGER;
  today DATE;
BEGIN
  -- Get the associated workout
  SELECT * INTO workout_record
  FROM workouts
  WHERE id = NEW.workout_id;

  -- Check if all exercises are completed
  SELECT bool_and(completed) INTO all_completed
  FROM workout_exercises
  WHERE workout_id = NEW.workout_id;

  -- If all exercises are completed, update workout and progress
  IF all_completed THEN
    -- Calculate total minutes
    SELECT COALESCE(SUM(duration_minutes), 0)
    INTO total_minutes
    FROM workout_exercises
    WHERE workout_id = NEW.workout_id;

    -- Set default if no duration found
    IF total_minutes = 0 THEN
      total_minutes := 5 * (
        SELECT COUNT(*)
        FROM workout_exercises
        WHERE workout_id = NEW.workout_id
      );
    END IF;

    today := CURRENT_DATE;

    -- Update workout status
    UPDATE workouts
    SET completed = TRUE
    WHERE id = NEW.workout_id
    AND NOT completed;

    -- Only update progress if workout wasn't already completed
    IF NOT workout_record.completed THEN
      -- Update or create progress record
      INSERT INTO user_progress (
        user_id,
        date,
        workouts_completed,
        xp_earned,
        streak_count
      )
      VALUES (
        workout_record.user_id,
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for exercise completion
CREATE TRIGGER exercise_completion_trigger
  AFTER UPDATE ON workout_exercises
  FOR EACH ROW
  EXECUTE FUNCTION handle_exercise_completion();

-- Reset progress data
BEGIN;
  -- First, clear existing progress
  DELETE FROM user_progress;
  
  -- Recalculate progress from completed workouts
  INSERT INTO user_progress (user_id, date, workouts_completed, xp_earned, streak_count)
  SELECT 
    w.user_id,
    DATE(w.created_at) as workout_date,
    COUNT(DISTINCT w.id) as workouts_completed,
    COALESCE(SUM(
      CASE 
        WHEN we.duration_minutes > 0 THEN we.duration_minutes
        ELSE 5  -- default 5 minutes per exercise
      END
    ), 0) as xp_earned,
    1 as streak_count
  FROM workouts w
  JOIN workout_exercises we ON w.id = we.workout_id
  WHERE w.completed = true
  GROUP BY w.user_id, DATE(w.created_at);

  -- Update streak counts
  WITH RECURSIVE dates AS (
    SELECT 
      user_id,
      date,
      1 as streak
    FROM user_progress
    WHERE date = CURRENT_DATE
    
    UNION ALL
    
    SELECT 
      d.user_id,
      d.date - 1 as date,
      d.streak + 1
    FROM dates d
    JOIN user_progress p ON p.user_id = d.user_id AND p.date = d.date - 1
  )
  UPDATE user_progress up
  SET streak_count = d.streak
  FROM (
    SELECT user_id, date, streak
    FROM dates
  ) d
  WHERE up.user_id = d.user_id AND up.date = d.date;
COMMIT; 