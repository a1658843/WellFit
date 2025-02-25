-- Add type column to workouts
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS type text 
CHECK (type IN ('work', 'exercise')) 
DEFAULT 'exercise';

-- Add work-friendly flag to exercises
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS is_work_friendly boolean 
DEFAULT false;

-- Update existing exercises to mark appropriate ones as work-friendly
UPDATE exercises 
SET is_work_friendly = true 
WHERE name ILIKE '%stretch%' 
   OR name ILIKE '%desk%'
   OR name ILIKE '%seated%'
   OR name ILIKE '%office%'
   OR description ILIKE '%work%'
   OR description ILIKE '%office%'
   OR description ILIKE '%desk%';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_workouts_type 
ON workouts(type, user_id, completed);

CREATE INDEX IF NOT EXISTS idx_exercises_work_friendly 
ON exercises(is_work_friendly);

-- Create view for active workouts
CREATE OR REPLACE VIEW active_workouts AS
SELECT w.*, 
       COUNT(we.id) as total_exercises,
       COUNT(CASE WHEN we.completed THEN 1 END) as completed_exercises
FROM workouts w
LEFT JOIN workout_exercises we ON w.id = we.workout_id
WHERE NOT w.completed
GROUP BY w.id; 