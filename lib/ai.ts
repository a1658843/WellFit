import { supabase } from "./supabase";
import config from "./config";
import { WorkoutPlan } from "../types/workouts";

type AIResponse = {
  content: string;
  tokenUsage?: number;
};

export const safeGenerateAIResponse = async (
  prompt: string,
  systemPrompt?: string
): Promise<AIResponse | null> => {
  try {
    const requestBody = {
      prompt,
      systemPrompt,
    };

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("No auth session");
    }

    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/ai-trainer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();

    if (!data?.response) {
      throw new Error("Invalid response format from AI service");
    }

    return {
      content: data.response,
      tokenUsage: data.usage?.total_tokens,
    };

  } catch (error) {
    console.error("AI Service Error:", error);
    return null;
  }
};

// Helper function to analyze professions
export const analyzeProfession = async (professionName: string) => {
  const systemPrompt = `Analyze this profession and return a JSON object with:
  1. Physical demands
  2. Workplace environment
  3. Common movements
  4. Health risks
  5. Recommended exercise types
  6. Exercise frequency
  
  Format:
  {
    "category": "string",
    "characteristics": {
      "physical_demands": string[],
      "workplace": string[],
      "movements": string[]
    },
    "health_risks": string[],
    "exercise_recommendations": {
      "types": string[],
      "frequency": string,
      "focus_areas": string[]
    }
  }`;

  const response = await safeGenerateAIResponse(
    `Analyze the profession: ${professionName}`,
    systemPrompt
  );

  return response?.content ? JSON.parse(response.content) : null;
};

// Helper function to generate exercises
export const generateExercisesForProfession = async (professionData: any) => {
  const systemPrompt = `Based on these profession characteristics, generate appropriate exercises:
  ${JSON.stringify(professionData)}
  
  Return exercises that:
  1. Address specific health risks
  2. Can be done in their workplace
  3. Counter negative physical effects
  4. Match their movement patterns
  
  Format:
  {
    "exercises": [
      {
        "name": "string",
        "description": "string",
        "duration_minutes": number,
        "target_areas": string[],
        "frequency": "string",
        "reason": "string"
      }
    ]
  }`;

  const response = await safeGenerateAIResponse(
    "Generate targeted exercises",
    systemPrompt
  );

  return response?.content ? JSON.parse(response.content) : null;
};

const getExerciseCount = (fitnessLevel: string): number => {
  switch (fitnessLevel) {
    case "advanced":
      return 8;
    case "intermediate":
      return 6;
    case "beginner":
    default:
      return 4;
  }
};

// Add this exercise pool at the top of the file
const exercisePool = {
  lowerBody: [
    {
      name: "Squats",
      description: "Stand with feet shoulder-width apart. Lower body as if sitting back into a chair.",
      target_areas: ["quads", "glutes"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Lunges",
      description: "Step forward with one leg, lowering until both knees are bent at 90 degrees.",
      target_areas: ["quads", "hamstrings", "glutes"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Calf Raises",
      description: "Stand on edge of step, raise heels up and lower back down.",
      target_areas: ["calves"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Glute Bridges",
      description: "Lie on back, feet flat, lift hips toward ceiling.",
      target_areas: ["glutes", "hamstrings"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Jump Squats",
      description: "Perform a squat, then explosively jump up. Land softly and repeat.",
      target_areas: ["quads", "glutes", "calves"],
      is_work_friendly: false,
      difficulty: "advanced"
    },
    {
      name: "Wall Sits",
      description: "Lean against wall, slide down until thighs are parallel to ground.",
      target_areas: ["quads", "glutes"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Step-Ups",
      description: "Using a sturdy platform, step up with one leg, then the other.",
      target_areas: ["quads", "glutes", "calves"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Bulgarian Split Squats",
      description: "Place one foot behind on elevated surface, lower into a lunge.",
      target_areas: ["quads", "glutes", "balance"],
      is_work_friendly: false,
      difficulty: "beginner"
    }
  ],
  upperBody: [
    {
      name: "Push-Ups",
      description: "Start in plank position. Lower chest to ground and push back up.",
      target_areas: ["chest", "shoulders", "triceps"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Tricep Dips",
      description: "Using a chair, lower body with arms then push back up.",
      target_areas: ["triceps", "shoulders"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Diamond Push-Ups",
      description: "Push-ups with hands close together forming a diamond shape.",
      target_areas: ["triceps", "chest"],
      is_work_friendly: true,
      difficulty: "advanced"
    },
    {
      name: "Pike Push-Ups",
      description: "Push-ups with hips raised, forming an inverted V shape.",
      target_areas: ["shoulders", "triceps"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Wall Push-Ups",
      description: "Push-ups performed against a wall, great for beginners.",
      target_areas: ["chest", "shoulders"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Arm Circles",
      description: "Make circular motions with arms extended.",
      target_areas: ["shoulders", "arms"],
      is_work_friendly: true,
      difficulty: "beginner"
    }
  ],
  abs: [
    {
      name: "Crunches",
      description: "Lie on back, lift shoulders off ground engaging core.",
      target_areas: ["abs", "core"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Plank",
      description: "Hold straight-arm plank position, maintaining straight body.",
      target_areas: ["core", "abs"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Russian Twists",
      description: "Sit with knees bent, rotate torso side to side.",
      target_areas: ["obliques", "core"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Mountain Climbers",
      description: "In plank position, alternate bringing knees to chest.",
      target_areas: ["core", "cardio"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Bicycle Crunches",
      description: "Lie on back, alternate elbow to opposite knee.",
      target_areas: ["obliques", "core"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Dead Bug",
      description: "Lie on back, alternate extending opposite arm and leg.",
      target_areas: ["core", "stability"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Bird Dog",
      description: "On hands and knees, extend opposite arm and leg.",
      target_areas: ["core", "balance"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Side Plank",
      description: "Hold plank position on one side, supporting with forearm.",
      target_areas: ["obliques", "core"],
      is_work_friendly: true,
      difficulty: "beginner"
    }
  ],
  back: [
    {
      name: "Pull-Ups",
      description: "Hang from bar, pull body up until chin is over bar.",
      target_areas: ["back", "lats"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Inverted Rows",
      description: "Using a sturdy table or bar at waist height, pull chest to bar while body is straight.",
      target_areas: ["back", "rhomboids"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Superman Holds",
      description: "Lie face down, lift arms and legs off ground, hold position.",
      target_areas: ["lower back", "core"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Band Pull-Aparts",
      description: "Hold resistance band in front, pull apart engaging shoulder blades.",
      target_areas: ["upper back", "rear deltoids"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Good Morning",
      description: "Stand with feet shoulder-width, hinge at hips keeping back straight.",
      target_areas: ["lower back", "hamstrings"],
      is_work_friendly: true,
      difficulty: "beginner"
    }
  ],
  shoulders: [
    {
      name: "Pike Push-Ups",
      description: "Push-ups with hips raised, forming an inverted V shape.",
      target_areas: ["shoulders", "triceps"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Lateral Raises",
      description: "Raise arms out to sides until parallel with ground.",
      target_areas: ["lateral deltoids"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Front Raises",
      description: "Raise arms straight in front until parallel with ground.",
      target_areas: ["front deltoids"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Reverse Flies",
      description: "Bend forward, raise arms out to sides engaging rear shoulders.",
      target_areas: ["rear deltoids", "upper back"],
      is_work_friendly: true,
      difficulty: "beginner"
    }
  ],
  chest: [
    {
      name: "Push-Ups",
      description: "Start in plank position. Lower chest to ground and push back up.",
      target_areas: ["chest", "shoulders", "triceps"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Incline Push-Ups",
      description: "Push-ups with hands elevated on stable surface.",
      target_areas: ["lower chest", "shoulders"],
      is_work_friendly: true,
      difficulty: "beginner"
    },
    {
      name: "Decline Push-Ups",
      description: "Push-ups with feet elevated on stable surface.",
      target_areas: ["upper chest", "shoulders"],
      is_work_friendly: true,
      difficulty: "beginner"
    }
  ],
  glutes: [
    {
      name: "Hip Thrusts",
      description: "Sit with upper back against bench, roll bar over hips, thrust upward.",
      target_areas: ["glutes", "hamstrings"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Glute Bridges",
      description: "Lie on back, feet flat, lift hips toward ceiling.",
      target_areas: ["glutes", "hamstrings"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Fire Hydrants",
      description: "On hands and knees, lift leg out to side while keeping knee bent.",
      target_areas: ["glutes", "hip abductors"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Donkey Kicks",
      description: "On hands and knees, kick one leg back and up toward ceiling.",
      target_areas: ["glutes", "lower back"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Single-Leg Glute Bridge",
      description: "Perform glute bridge with one leg extended.",
      target_areas: ["glutes", "core", "balance"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Frog Pumps",
      description: "Lie on back, soles of feet together, lift hips.",
      target_areas: ["glutes", "inner thighs"],
      is_work_friendly: false,
      difficulty: "beginner"
    }
  ],
  hamstrings: [
    {
      name: "Romanian Deadlifts",
      description: "Stand tall, hinge at hips while keeping back straight.",
      target_areas: ["hamstrings", "lower back", "glutes"],
      is_work_friendly: false,
      difficulty: "beginner"
    },
    {
      name: "Leg Curls",
      description: "Lie face down, curl legs toward buttocks.",
      target_areas: ["hamstrings"],
      is_work_friendly: false,
      difficulty: "beginner"
    }
  ]
};

// Add this helper function to randomly select exercises
const getRandomExercises = (
  pool: typeof exercisePool[keyof typeof exercisePool],
  count: number,
  fitnessLevel: string
): any[] => {
  // Weight the random selection based on fitness level
  const weightedPool = pool.filter(exercise => {
    if (fitnessLevel === "beginner") {
      return exercise.difficulty !== "advanced";
    }
    if (fitnessLevel === "intermediate") {
      return exercise.difficulty !== "advanced";
    }
    return true; // advanced users can get any exercise
  });

  const shuffled = [...weightedPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(exercise => ({
    ...exercise,
    sets: fitnessLevel === "beginner" ? 3 : 4,
    reps: fitnessLevel === "beginner" ? 10 : 15,
    duration_minutes: 5,
  }));
};

// Update the muscleGroupMapping to match the exercise pool keys
const muscleGroupMapping: Record<string, string[]> = {
  upperbody: ['chest', 'back', 'shoulders'], // Changed from 'upperBody' to 'upperbody'
  lowerbody: ['lowerBody', 'glutes', 'hamstrings'], // Changed from 'lowerBody' to 'lowerbody'
};

export const generateWorkoutPlan = async (userInput: string): Promise<WorkoutPlan | null> => {
  const lowerCaseInput = userInput.toLowerCase();

  const workoutType = {
    isAbs: lowerCaseInput.includes("abs") || 
           lowerCaseInput.includes("core") || 
           lowerCaseInput.includes("stomach"),
    isLowerBody: lowerCaseInput.includes("lower") || 
                 lowerCaseInput.includes("leg") || 
                 lowerCaseInput.includes("thigh"),
    isUpperBody: lowerCaseInput.includes("upper") || 
                 lowerCaseInput.includes("arm"),
    isBack: lowerCaseInput.includes("back") ||
            lowerCaseInput.includes("lats"),
    isShoulders: lowerCaseInput.includes("shoulder") ||
                 lowerCaseInput.includes("delt"),
    isChest: lowerCaseInput.includes("chest") ||
             lowerCaseInput.includes("pec"),
    isGlutes: lowerCaseInput.includes("glute") ||
              lowerCaseInput.includes("butt") ||
              lowerCaseInput.includes("booty"),
    isHamstrings: lowerCaseInput.includes("hamstring") ||
                  lowerCaseInput.includes("ham"),
    isFullBody: lowerCaseInput.includes("full") || 
                lowerCaseInput.includes("whole")
  };

  const fitnessLevel = lowerCaseInput.includes("advanced") ? "advanced" :
                      lowerCaseInput.includes("intermediate") ? "intermediate" : 
                      "beginner";

  const requestedGroups = Object.entries(workoutType).filter(([key, value]) => 
    value && key !== 'isFullBody'
  );

  let title = "Full Body Workout";
  const exercises = [];
  const exerciseCount = getExerciseCount(fitnessLevel);

  if (requestedGroups.length > 0) {
    title = requestedGroups
      .map(([key]) => key.replace('is', '').replace(/([A-Z])/g, ' $1').trim())
      .join(' & ') + ' Workout';

    for (const [key] of requestedGroups) {
      const muscleGroup = key.replace('is', '').toLowerCase();
      
      // Add debug logging
      console.log("Processing muscle group:", muscleGroup);
      
      if (muscleGroupMapping[muscleGroup]) {
        const subGroups = muscleGroupMapping[muscleGroup];
        const countPerSubGroup = Math.ceil(exerciseCount / subGroups.length);
        
        console.log("Subgroups:", subGroups);
        
        subGroups.forEach(subGroup => {
          const poolKey = subGroup as keyof typeof exercisePool;
          console.log("Checking pool for:", poolKey);
          
          if (exercisePool[poolKey]) {
            const selectedExercises = getRandomExercises(exercisePool[poolKey], countPerSubGroup, fitnessLevel);
            console.log(`Selected ${selectedExercises.length} exercises from ${poolKey}`);
            exercises.push(...selectedExercises);
          }
        });
      } else {
        // Handle single muscle groups
        const poolKey = muscleGroup as keyof typeof exercisePool;
        if (exercisePool[poolKey]) {
          exercises.push(
            ...getRandomExercises(exercisePool[poolKey], exerciseCount, fitnessLevel)
          );
        }
      }
    }
  } else {
    // Full body workout logic
    const majorMuscleGroups = ['chest', 'back', 'lowerBody', 'abs'];
    const countPerType = Math.floor(exerciseCount / majorMuscleGroups.length);
    
    majorMuscleGroups.forEach(group => {
      const poolKey = group as keyof typeof exercisePool;
      if (exercisePool[poolKey]) {
        exercises.push(
          ...getRandomExercises(exercisePool[poolKey], countPerType, fitnessLevel)
        );
      }
    });
  }

  // Add final debug logging
  console.log("Total exercises generated:", exercises.length);

  return {
    title,
    type: "exercise",
    exercises,
  };
}; 