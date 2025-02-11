-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Professions table
create table professions (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    category text not null,
    health_risks text[]
);

-- Create users table first (if it doesn't exist)
create table if not exists users (
    id uuid primary key,
    email text unique not null,
    created_at timestamp with time zone default now(),
    profession_id uuid references professions(id),
    age_range text,
    fitness_level text,
    work_schedule jsonb,
    xp_points integer default 0,
    subscription_status text default 'free',
    subscription_end_date timestamp with time zone
);

-- Exercises table
create table if not exists exercises (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    duration text,
    difficulty_level text,
    target_areas text[],
    video_url text,
    is_micro_workout boolean default false,
    profession_id uuid references professions(id)
);

-- Workouts table
create table workouts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id),
    created_at timestamp with time zone default now(),
    type text,
    completed boolean default false,
    feedback text
);

-- Workout_exercises junction table
create table workout_exercises (
    workout_id uuid references workouts(id),
    exercise_id uuid references exercises(id),
    sets integer,
    reps integer,
    completed boolean default false,
    primary key (workout_id, exercise_id)
);

-- User_progress table
create table user_progress (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id),
    date date not null,
    xp_earned integer default 0,
    workouts_completed integer default 0,
    streak_count integer default 0
); 