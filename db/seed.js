const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://czfgmiijcxnxayrnkznd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZmdtaWlqY3hueGF5cm5rem5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3OTA4NDUsImV4cCI6MjA1NDM2Njg0NX0.sKLMOA3SvV5RrIHxWdhKKp8taKnWEYVJD9ASmGVpwqk"
);

const PROFESSIONS = [
  {
    name: "Office Worker",
    category: "Desk Work",
    health_risks: ["lower back pain", "eye strain", "carpal tunnel"],
  },
  {
    name: "Nurse",
    category: "Healthcare",
    health_risks: ["varicose veins", "back strain", "foot pain"],
  },
  {
    name: "Chef",
    category: "Food Service",
    health_risks: ["foot pain", "back strain", "burns"],
  },
  {
    name: "Teacher",
    category: "Education",
    health_risks: ["voice strain", "stress", "standing fatigue"],
  },
  {
    name: "Driver",
    category: "Transportation",
    health_risks: ["lower back pain", "neck strain", "leg cramps"],
  },
];

async function seedProfessions() {
  try {
    console.log("Checking existing professions...");
    const { data: existing, error: checkError } = await supabase
      .from("professions")
      .select("name");

    if (checkError) {
      console.error("Error checking professions:", checkError);
      return;
    }

    console.log("Existing professions:", existing);

    if (existing && existing.length > 0) {
      console.log("Professions already exist, skipping seed.");
      return;
    }

    console.log("Inserting professions...");
    const { data, error } = await supabase
      .from("professions")
      .insert(PROFESSIONS)
      .select();

    if (error) {
      console.error("Error seeding professions:", error);
      return;
    }

    console.log("Professions seeded successfully!", data);
  } catch (error) {
    console.error("Unexpected error:", error);
  } finally {
    // Exit the process after seeding
    process.exit(0);
  }
}

// Add error handler for unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

seedProfessions(); 