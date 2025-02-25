export type ProfessionData = {
  name: string;
  category: string;
  physical_demands: string[];
  workplace_environment: string;
  common_issues: Array<{ issue: string; severity: 'high' | 'medium' | 'low' }>;
  recommended_exercises: Array<{
    name: string;
    description: string;
    duration: string;
    frequency: string;
    target_areas: string[];
    focus_areas: string[];
  }>;
};

export const PROFESSIONS: ProfessionData[] = [
  {
    name: "Office Worker",
    category: "Desk Work",
    physical_demands: ["sitting", "typing", "screen viewing"],
    workplace_environment: "sedentary",
    common_issues: [
      { issue: "lower back pain", severity: "high" },
      { issue: "eye strain", severity: "high" },
      { issue: "carpal tunnel", severity: "medium" },
      { issue: "poor posture", severity: "high" }
    ],
    recommended_exercises: [
      {
        name: "Desk Stretches",
        description: "Simple stretches you can do at your desk",
        duration: "5 minutes",
        frequency: "every hour",
        target_areas: ["back", "neck", "shoulders"],
        focus_areas: ["posture", "flexibility"]
      },
      {
        name: "Eye Relief",
        description: "Eye exercises to reduce strain",
        duration: "2 minutes",
        frequency: "every 30 minutes",
        target_areas: ["eyes"],
        focus_areas: ["eye health"]
      }
    ]
  },
  {
    name: "Doctor",
    category: "Healthcare",
    physical_demands: ["standing", "walking", "lifting"],
    workplace_environment: "active",
    common_issues: [
      { issue: "back strain", severity: "high" },
      { issue: "foot fatigue", severity: "high" },
      { issue: "stress", severity: "high" }
    ],
    recommended_exercises: [
      {
        name: "Quick Stretches",
        description: "Simple stretches between patients",
        duration: "5 minutes",
        frequency: "every 2 hours",
        target_areas: ["back", "neck", "shoulders"],
        focus_areas: ["back", "neck", "shoulders"]
      },
      {
        name: "Posture Reset",
        description: "Alignment exercises for better posture",
        duration: "2 minutes",
        frequency: "hourly",
        target_areas: ["spine", "core"],
        focus_areas: ["posture", "core"]
      }
    ]
  },
  {
    name: "Teacher",
    category: "Education",
    physical_demands: ["standing", "speaking", "writing"],
    workplace_environment: "active",
    common_issues: [
      { issue: "voice strain", severity: "high" },
      { issue: "back pain", severity: "medium" },
      { issue: "foot fatigue", severity: "medium" }
    ],
    recommended_exercises: [
      {
        name: "Voice Rest",
        description: "Vocal rest and hydration breaks",
        duration: "5 minutes",
        frequency: "hourly",
        target_areas: ["throat", "neck"],
        focus_areas: ["voice", "neck"]
      },
      {
        name: "Classroom Stretches",
        description: "Stretches while supervising students",
        duration: "3 minutes",
        frequency: "every 2 hours",
        target_areas: ["back", "legs"],
        focus_areas: ["back", "legs"]
      }
    ]
  },
  {
    name: "Nurse",
    category: "Healthcare",
    physical_demands: ["walking", "lifting", "bending"],
    workplace_environment: "active",
    common_issues: [
      { issue: "back strain", severity: "high" },
      { issue: "foot pain", severity: "high" },
      { issue: "fatigue", severity: "high" }
    ],
    recommended_exercises: [
      {
        name: "Quick Recovery",
        description: "Brief exercises between rounds",
        duration: "3 minutes",
        frequency: "every 2 hours",
        target_areas: ["back", "legs"],
        focus_areas: ["recovery", "strength"]
      }
    ]
  },
  {
    name: "Chef",
    category: "Food Service",
    physical_demands: ["standing", "lifting", "repetitive motions"],
    workplace_environment: "active",
    common_issues: [
      { issue: "foot pain", severity: "high" },
      { issue: "wrist strain", severity: "medium" },
      { issue: "back pain", severity: "high" }
    ],
    recommended_exercises: [
      {
        name: "Kitchen Stretches",
        description: "Quick stretches during prep time",
        duration: "3 minutes",
        frequency: "every hour",
        target_areas: ["legs", "back", "wrists"],
        focus_areas: ["flexibility", "relief"]
      }
    ]
  },
  {
    name: "Driver",
    category: "Transportation",
    physical_demands: ["sitting", "concentration", "repetitive movements"],
    workplace_environment: "sedentary",
    common_issues: [
      { issue: "lower back pain", severity: "high" },
      { issue: "neck strain", severity: "medium" },
      { issue: "leg cramps", severity: "medium" }
    ],
    recommended_exercises: [
      {
        name: "Driver's Relief",
        description: "Exercises during breaks",
        duration: "5 minutes",
        frequency: "every 2 hours",
        target_areas: ["back", "neck", "legs"],
        focus_areas: ["mobility", "circulation"]
      }
    ]
  },
  {
    name: "Retail Worker",
    category: "Sales",
    physical_demands: ["standing", "lifting", "walking"],
    workplace_environment: "active",
    common_issues: [
      { issue: "foot fatigue", severity: "high" },
      { issue: "back strain", severity: "medium" },
      { issue: "leg fatigue", severity: "medium" }
    ],
    recommended_exercises: [
      {
        name: "Register Relief",
        description: "Quick exercises during quiet times",
        duration: "2 minutes",
        frequency: "every hour",
        target_areas: ["feet", "legs", "back"],
        focus_areas: ["relief", "circulation"]
      }
    ]
  },
  {
    name: "Construction Worker",
    category: "Construction",
    physical_demands: ["heavy lifting", "climbing", "bending"],
    workplace_environment: "very active",
    common_issues: [
      { issue: "back strain", severity: "high" },
      { issue: "joint stress", severity: "high" },
      { issue: "muscle fatigue", severity: "high" }
    ],
    recommended_exercises: [
      {
        name: "Site Stretches",
        description: "Stretches to prevent injury",
        duration: "5 minutes",
        frequency: "every 2 hours",
        target_areas: ["back", "shoulders", "legs"],
        focus_areas: ["flexibility", "strength"]
      }
    ]
  },
  {
    name: "Software Developer",
    category: "Technology",
    physical_demands: ["sitting", "typing", "screen viewing"],
    workplace_environment: "sedentary",
    common_issues: [
      { issue: "eye strain", severity: "high" },
      { issue: "wrist pain", severity: "high" },
      { issue: "poor posture", severity: "high" }
    ],
    recommended_exercises: [
      {
        name: "Coding Break",
        description: "Screen break exercises",
        duration: "5 minutes",
        frequency: "every hour",
        target_areas: ["eyes", "wrists", "back"],
        focus_areas: ["eye health", "ergonomics"]
      }
    ]
  }
];

export function findProfession(search: string): ProfessionData | null {
  const normalizedSearch = search.toLowerCase().trim();
  return PROFESSIONS.find(p => 
    p.name.toLowerCase() === normalizedSearch ||
    p.name.toLowerCase().includes(normalizedSearch)
  ) || null;
} 