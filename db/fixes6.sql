BEGIN;

-- First, update existing workouts to have a valid type
UPDATE workouts 
SET type = 'exercise' 
WHERE type IS NULL OR type NOT IN ('work', 'exercise');

-- Now update exercises table
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS equipment_needed text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_areas text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sets integer,
ADD COLUMN IF NOT EXISTS reps integer,
ADD COLUMN IF NOT EXISTS duration_minutes integer;

-- Update workout_exercises table
ALTER TABLE workout_exercises
ADD COLUMN IF NOT EXISTS equipment_used text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_areas text[] DEFAULT '{}',
ALTER COLUMN sets DROP NOT NULL,
ALTER COLUMN reps DROP NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_exercises_work_friendly 
ON exercises(is_work_friendly);

CREATE INDEX IF NOT EXISTS idx_workouts_type_user 
ON workouts(type, user_id, completed);

-- Update existing exercises with better categorization
UPDATE exercises
SET 
  is_work_friendly = true,
  duration_minutes = 
    CASE 
      WHEN duration ~ '^\d+' THEN CAST(substring(duration from '^\d+') as integer)
      ELSE 5
    END
WHERE 
  name ILIKE ANY(ARRAY['%stretch%', '%desk%', '%seated%', '%office%']) OR
  description ILIKE ANY(ARRAY['%work%', '%office%', '%desk%']);

-- Now it's safe to add the constraint
ALTER TABLE workouts
DROP CONSTRAINT IF EXISTS valid_workout_type,
ADD CONSTRAINT valid_workout_type
CHECK (type IN ('work', 'exercise'));

-- Create view for active workouts with better details
CREATE OR REPLACE VIEW active_workouts AS
SELECT 
  w.*,
  COUNT(we.id) as total_exercises,
  COUNT(CASE WHEN we.completed THEN 1 END) as completed_exercises,
  COALESCE(SUM(we.duration_minutes), 0) as total_duration,
  w.type = 'work' as is_work_mode
FROM workouts w
LEFT JOIN workout_exercises we ON w.id = we.workout_id
WHERE NOT w.completed
GROUP BY w.id;

-- Add function to calculate workout completion
CREATE OR REPLACE FUNCTION calculate_workout_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all exercises are completed
  IF EXISTS (
    SELECT 1 
    FROM workout_exercises 
    WHERE workout_id = NEW.workout_id 
    AND NOT completed
  ) THEN
    -- Not all exercises are completed
    UPDATE workouts 
    SET completed = false 
    WHERE id = NEW.workout_id;
  ELSE
    -- All exercises are completed
    UPDATE workouts 
    SET completed = true 
    WHERE id = NEW.workout_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for workout completion
DROP TRIGGER IF EXISTS workout_completion_trigger ON workout_exercises;
CREATE TRIGGER workout_completion_trigger
AFTER UPDATE OF completed ON workout_exercises
FOR EACH ROW
EXECUTE FUNCTION calculate_workout_completion();

COMMIT; 