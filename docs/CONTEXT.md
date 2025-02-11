# Fitness for Everyone - App Design Document

## Overview

A personalized fitness app that generates micro-workouts & routines based on user profession, physical habits, and feedback. Focuses on **preventive exercises** for occupation-related health risks and **adaptive AI-driven training** for days off work. Combines gamification (XP system) with a freemium subscription model.

## Tech Stack:

- Frontend: React Native with TypeScript, Expo, and Expo Router
- Backend/Database: Supabase
- UI Framework: React Native Paper
- AI Processing: DeepSeek

---

## Core User Flow

### 1. Onboarding

- **Welcome Screen**: Clean design with options to sign up (email/SSO) or log in.
- **Profile Setup**:
  - **Mandatory**: Select profession from a categorized list (e.g., Nurse, Office Worker, Chef).
  - **Optional**: Age range, fitness level (Beginner/Intermediate/Advanced).
  - **Work Schedule**: Input typical shift hours (e.g., 9 AM–5 PM).

### 2. Main Dashboard

- **Work Mode** (Primary UI during shifts):
  - Displays real-time notifications for micro-exercises (e.g., "5-min toe raises" every hour).
  - Progress bar showing daily goals (Minimum/Stretch targets).
- **Action System** (Post-work/Day Off):
  - AI-generated workouts (e.g., "15-min core routine").
  - Calendar view with historical workout data.
- **XP Counter**: Visible in header, tracks consistency for freemium access.

---

## Key Features

### Main Function 1: Work Mode

#### Profession-Based Micro-Workouts

- **AI Prediction**:
  - Maps professions to common health risks (e.g., nurses → varicose veins; office workers → lower back pain).
  - Suggests exercises targeting risk areas (toe raises, desk stretches).
- **In-Shift Notifications**:
  - Timed reminders (e.g., hourly) with 1-tap logging ("Done"/"Partial"/"Tried").
  - Exercises adjust based on shift duration (e.g., 8-hour shift → 8 notifications).
- **Exercise Library**:
  - Video demonstrations (AI-generated animations).
  - "Why This Exercise?" button explaining health benefits.

### Main Function 2: Action System (Day Off)

#### Adaptive Workouts

- **AI Personalization**:
  - Generates equipment-free routines (e.g., pushups, planks).
  - Adjusts difficulty based on post-workout feedback (too easy/hard).
- **Progress Tracking**:
  - Simple logging: Tap to record reps/sets completed.
  - Post-workout summary with encouragement (e.g., "Great job! You did 5 pushups!").
- **Calendar Integration**:
  - Color-coded days (green = goal met; yellow = partial; gray = skipped).
  - Drill-down for historical data.

---

## Visual & UX Requirements

- **Exercise Demos**:
  - Short AI-generated videos (≤15 sec) showing proper form.
  - Text/pop-up descriptions for exercise names (e.g., "Toe Raise: Lift heels, hold 2 sec").
- **Dashboard UI**:
  - Minimalist design with clear CTAs ("Start Workout", "Log Exercise").
  - Progress visuals (bars, streaks) to motivate engagement.

---

## Subscription & XP System

### Freemium Model

- **Free Tier**:
  - Earn 10 XP/day by completing all Work Mode notifications.
  - 50 XP/week → Unlock next week for free.
- **Paid Tier**:
  - $9.99/month or $19.99 lifetime.
  - No XP requirements; access to premium features (e.g., advanced analytics).
- **XP Mechanics**:
  - Work Mode: 10 XP (Full), 5 XP (Partial), 1 XP (Tried).
  - Action System: 20 XP/workout completion.

---

## Technical Specs

### Backend

- **AI Engine**:
  - ML model to correlate professions → health risks → exercises.
  - Feedback loop for workout difficulty adjustment.
- **Database Schema**:

  ```sql
  -- Users table
  create table users (
    id uuid primary key default uuid_generate_v4(),
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

  -- Professions table
  create table professions (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    category text not null,
    health_risks text[]
  );

  -- Exercises table
  create table exercises (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    duration interval,
    difficulty_level text,
    target_areas text[],
    video_url text,
    is_micro_workout boolean default false
  );

  -- Workouts table
  create table workouts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id),
    created_at timestamp with time zone default now(),
    type text, -- 'micro' or 'full'
    completed boolean default false,
    feedback text
  );

  -- Workout_exercises (junction table)
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
  ```

### Project Structure

### Frontend

- **Notifications**: Push alerts synced with user's shift hours.
- **Calendar Integration**: Sync with device calendars (optional).
- **Languages**: MVP in English; i18n support for Spanish/Chinese later.

---

## Roadmap

1. **MVP (Month 1-3)**: Core Work Mode + Action System with basic AI.
2. **Iteration 1 (Month 4)**: Add XP system and subscription gateway.
3. **Iteration 2 (Month 6)**: Multi-language support and social sharing.

# Implementation Plan

## Phase 1: Project Setup & Core Infrastructure (Week 1)

1. **Initial Project Setup**

   - Create React Native + Expo project with TypeScript
   - Set up Supabase connection
   - Configure React Native Paper
   - Initialize basic navigation with Expo Router

2. **Database Implementation**
   - Set up Supabase tables as per schema
   - Create initial seed data for professions and exercises
   - Implement basic authentication flows

## Phase 2: User Onboarding (Week 2)

1. **Authentication Screens**

   - Welcome screen
   - Sign up / Login forms
   - Email verification flow

2. **Profile Setup Flow**
   - Profession selection screen
   - Optional info collection (age, fitness level)
   - Work schedule input interface

## Phase 3: Work Mode Features (Weeks 3-4)

1. **Core Work Mode UI**

   - Dashboard layout
   - Progress bar components
   - Daily goals display

2. **Notification System**

   - Push notification setup
   - Exercise reminder logic
   - Quick-action response buttons

3. **Exercise Display**
   - Exercise detail screen
   - Basic animation/video player
   - Exercise logging system

## Phase 4: Action System Development (Weeks 5-6)

1. **Workout Generation**

   - AI integration for workout creation
   - Difficulty adjustment system
   - Exercise selection algorithms

2. **Progress Tracking**
   - Calendar view implementation
   - Workout history logging
   - Progress visualization

## Phase 5: XP & Subscription System (Weeks 7-8)

1. **XP System**

   - XP tracking logic
   - Progress persistence
   - Achievement notifications

2. **Subscription Features**
   - Payment integration
   - Premium feature gating
   - Subscription management

## Phase 6: Testing & Polish (Weeks 9-10)

1. **Testing**

   - Unit tests for core features
   - Integration testing
   - User acceptance testing

2. **Performance Optimization**
   - Load time optimization
   - Cache implementation
   - Memory usage optimization

## Phase 7: Launch Preparation (Weeks 11-12)

1. **Final Polish**

   - UI/UX refinements
   - Error handling
   - Loading states

2. **Deployment**
   - App store submission prep
   - Production environment setup
   - Documentation completion

## Success Metrics

- User retention after onboarding: Target 70%
- Daily active users completing Work Mode exercises: Target 60%
- Weekly XP goal achievement rate: Target 40%
- Conversion to paid subscription: Target 5%

## Next Steps

1. Begin with Phase 1: Project Setup
2. Create project repository
3. Set up development environment
4. Initialize basic project structure

Would you like to start with any specific phase or task?
