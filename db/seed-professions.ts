import { supabase } from "../lib/supabase";

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

export async function seedProfessions() {
  const { error } = await supabase.from("professions").insert(PROFESSIONS);
  
  if (error) {
    console.error("Error seeding professions:", error);
    return;
  }
  
  console.log("Professions seeded successfully!");
}

// Run the seed if this file is executed directly
if (require.main === module) {
  seedProfessions().catch(console.error);
} 