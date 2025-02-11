const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://czfgmiijcxnxayrnkznd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZmdtaWlqY3hueGF5cm5rem5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3OTA4NDUsImV4cCI6MjA1NDM2Njg0NX0.sKLMOA3SvV5RrIHxWdhKKp8taKnWEYVJD9ASmGVpwqk"
);

const EXERCISES = [
  {
    name: "Desk Stretches",
    description: "Simple stretches you can do at your desk to relieve tension",
    duration: "2 min",
    duration_minutes: 2,
    difficulty_level: "Beginner",
    target_areas: ["neck", "shoulders", "back"],
    is_micro_workout: true
  },
  {
    name: "Standing Desk Routine",
    description: "Exercises to do while working at a standing desk",
    duration: "3 min",
    duration_minutes: 3,
    difficulty_level: "Beginner",
    target_areas: ["legs", "core"],
    is_micro_workout: true
  },
  {
    name: "Eye Relief Exercises",
    description: "Exercises to reduce eye strain from screen time",
    duration: "1 min",
    duration_minutes: 1,
    difficulty_level: "Beginner",
    target_areas: ["eyes"],
    is_micro_workout: true
  },
  {
    name: "Posture Correction",
    description: "Quick exercises to improve posture and prevent back pain",
    duration: "5 min",
    duration_minutes: 5,
    difficulty_level: "Beginner",
    target_areas: ["back", "core", "shoulders"],
    is_micro_workout: true
  },
  {
    name: "Wrist and Hand Stretches",
    description: "Prevent carpal tunnel with these hand exercises",
    duration: "2 min",
    duration_minutes: 2,
    difficulty_level: "Beginner",
    target_areas: ["wrists", "hands"],
    is_micro_workout: true
  },
  {
    name: "Full Body Office Workout",
    description: "Complete workout routine you can do in your office",
    duration: "20 min",
    duration_minutes: 20,
    difficulty_level: "Intermediate",
    target_areas: ["full body"],
    is_micro_workout: false
  }
];

async function seedExercises() {
  try {
    console.log("Checking existing exercises...");
    const { data: existing, error: checkError } = await supabase
      .from("exercises")
      .select("name");

    if (checkError) {
      console.error("Error checking exercises:", checkError);
      return;
    }

    if (existing && existing.length > 0) {
      console.log("Exercises already exist, skipping seed.");
      return;
    }

    console.log("Inserting exercises...");
    const { data, error } = await supabase
      .from("exercises")
      .insert(EXERCISES)
      .select();

    if (error) {
      console.error("Error seeding exercises:", error);
      return;
    }

    console.log("Exercises seeded successfully!", data);
  } catch (error) {
    console.error("Unexpected error:", error);
  } finally {
    process.exit(0);
  }
}

seedExercises(); 