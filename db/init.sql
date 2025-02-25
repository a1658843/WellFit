-- First drop tables in correct order (dependent tables first)
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS work_sessions CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS professions CASCADE;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables in order (base tables first)
CREATE TABLE professions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    category text NOT NULL,
    health_risks text[]
);

CREATE TABLE users (
    id uuid PRIMARY KEY,
    email text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    profession_id uuid REFERENCES professions(id),
    profession_data jsonb DEFAULT '{}'::jsonb,
    profession_validated boolean DEFAULT false,
    age_range text,
    fitness_level text,
    work_schedule jsonb,
    xp_points integer DEFAULT 0,
    subscription_status text DEFAULT 'free',
    subscription_end_date timestamp with time zone
);

CREATE TABLE exercises (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    duration text,
    difficulty_level text,
    target_areas text[],
    video_url text,
    is_micro_workout boolean DEFAULT false,
    profession_id uuid REFERENCES professions(id)
);

CREATE TABLE workouts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id),
    created_at timestamp with time zone DEFAULT now(),
    type text,
    completed boolean DEFAULT false,
    feedback text,
    title text
);

CREATE TABLE workout_exercises (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    sets integer DEFAULT 3,
    reps integer DEFAULT 10,
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE user_progress (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id),
    date date NOT NULL,
    xp_earned integer DEFAULT 0,
    workouts_completed integer DEFAULT 0,
    streak_count integer DEFAULT 0
);

CREATE TABLE work_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id),
    start_time timestamp with time zone DEFAULT now(),
    end_time timestamp with time zone,
    completed_exercises integer DEFAULT 0,
    total_exercises integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS workout_exercises_workout_id_idx ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON workouts(user_id);
CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS work_sessions_user_id_idx ON work_sessions(user_id);