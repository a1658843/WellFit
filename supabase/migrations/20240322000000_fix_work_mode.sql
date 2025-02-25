-- Fix the workout type constraint
ALTER TABLE workouts 
DROP CONSTRAINT IF EXISTS valid_workout_type;

ALTER TABLE workouts 
ADD CONSTRAINT valid_workout_type 
CHECK (type IN ('work', 'exercise', 'quick'));

-- Add work session tracking
CREATE TABLE IF NOT EXISTS work_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  start_time timestamp with time zone DEFAULT now(),
  end_time timestamp with time zone,
  completed_exercises integer DEFAULT 0,
  total_exercises integer DEFAULT 0
);

-- Add index for user sessions
CREATE INDEX IF NOT EXISTS idx_work_sessions_user 
ON work_sessions(user_id, start_time DESC); 