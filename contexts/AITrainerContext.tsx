import { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import config from "../lib/config";
import { WorkoutPlan, AIResponse } from "../types/workouts";
import { useWorkout } from "./WorkoutContext";
import { generateId } from "../utils/id";
import { PROFESSIONS } from "../data/professions";

type Exercise = {
  name: string;
  description: string;
  sets?: number;
  reps?: number;
  duration?: string;
};

type Workout = {
  title: string;
  exercises: Exercise[];
  type: "work" | "exercise";
};

type AITrainerContextType = {
  getWorkoutRecommendation: (userProfile?: any) => Promise<AIResponse>;
  getMotivationalMessage: () => Promise<AIResponse>;
  analyzeProgress: (stats: UserStats) => Promise<AIResponse>;
  safeGenerateAIResponse: (
    prompt: string,
    systemPrompt?: string
  ) => Promise<AIResponse | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  generateWorkoutPlan: (
    prompt: string,
    type?: "work" | "exercise"
  ) => Promise<Workout>;
  analyzeNewProfession: (professionName: string) => Promise<any>;
  getFeedbackForProfession: (professionName: string) => Promise<AIResponse>;
};

type UserProfile = {
  profession: string;
  fitnessLevel: string;
  healthGoals?: string[];
  recentWorkouts?: WorkoutSummary[];
};

type UserProgress = {
  streak: number;
  completedToday: boolean;
  totalWorkouts: number;
  recentConsistency: number;
};

type WorkoutSummary = {
  type: string;
  completed: boolean;
  exercises: string[];
  date: string;
};

type UserStats = {
  totalWorkouts: number;
  totalMinutes: number;
  currentStreak: number;
  completionRate?: number;
};

const AITrainerContext = createContext<AITrainerContextType | undefined>(
  undefined
);

export function AITrainerProvider({ children }: { children: React.ReactNode }) {
  const workoutContext = useWorkout();
  const { createWorkout } = workoutContext;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const parseWorkoutFromResponse = (
    content: string,
    type: "work" | "exercise"
  ): WorkoutPlan | null => {
    try {
      // Find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.title || !Array.isArray(parsed.exercises)) {
        return null;
      }

      return {
        title: parsed.title,
        exercises: parsed.exercises.map((ex) => ({
          ...ex,
          description: ex.description.trim(),
          sets: ex.sets || (type === "work" ? undefined : 3),
          reps: ex.reps || (type === "work" ? undefined : 10),
        })),
        type,
      };
    } catch (error) {
      console.error("Error parsing workout response:", error);
      return null;
    }
  };

  const safeGenerateAIResponse = useCallback(
    async (
      prompt: string,
      systemPrompt?: string
    ): Promise<AIResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const requestBody = {
          prompt,
          systemPrompt,
        };
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("No auth session");
        }

        let retries = 3;
        while (retries > 0) {
          const response = await fetch(
            "https://czfgmiijcxnxayrnkznd.supabase.co/functions/v1/ai-trainer",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify(requestBody),
            }
          );

          console.log("Response status:", response.status);
          const data = await response.json();
          console.log("Response data:", data);

          if (response.status === 429) {
            retries--;
            if (retries > 0) {
              await delay(1000);
              continue;
            }
          }

          if (!response.ok) {
            throw new Error(data.error || "Failed to get AI response");
          }

          if (!data?.response) {
            throw new Error("Invalid response format from AI service");
          }

          const workoutPlan = parseWorkoutFromResponse(
            data.response,
            "exercise"
          );

          return {
            content: data.response,
            tokenUsage: data.usage?.total_tokens || 0,
            workoutPlan: workoutPlan || undefined,
          };
        }

        throw new Error("Failed after retries");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get AI response";
        setError(errorMessage);
        console.error("AI Service Error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getMotivationalMessage = async (): Promise<AIResponse> => {
    const prompt =
      "Give a short, motivating workplace wellness tip for today (max 30 words).";

    const response = await safeGenerateAIResponse(prompt);
    return (
      response || {
        content: "Take a 2-minute stretch break every hour to stay energized!",
        tokenUsage: 0,
      }
    );
  };

  const getWorkoutRecommendation = async (
    userProfile?: any
  ): Promise<AIResponse> => {
    const prompt = "Suggest a quick office-friendly exercise (max 30 words).";

    const response = await safeGenerateAIResponse(prompt);
    return (
      response || {
        content: "Try 10 desk push-ups to strengthen your arms and core.",
        tokenUsage: 0,
      }
    );
  };

  const analyzeProgress = async (stats: UserStats): Promise<AIResponse> => {
    const prompt = `Analyze this fitness progress data and provide insights: ${JSON.stringify(
      stats
    )}. Focus on trends and actionable recommendations.`;

    const response = await safeGenerateAIResponse(prompt);
    return (
      response || {
        content: "Keep tracking your progress and staying consistent!",
        tokenUsage: 0,
      }
    );
  };

  const generateWorkoutPlan = async (
    prompt: string,
    type: "work" | "exercise" = "exercise"
  ): Promise<Workout> => {
    try {
      // Convert the user's input into a structured workout
      const structuredWorkout = {
        title: type === "work" ? "Office Workout" : "Exercise Routine",
        exercises: prompt
          .split(/[.,\n]/)
          .filter((line) => line.trim())
          .map((exercise) => ({
            name: exercise.split(":")[0]?.trim() || "Exercise",
            description: exercise.split(":")[1]?.trim() || exercise.trim(),
            duration_minutes: type === "work" ? 5 : undefined,
            sets: type === "work" ? undefined : 3,
            reps: type === "work" ? undefined : 10,
            target_areas: ["general"],
            is_work_friendly: type === "work",
          })),
      };

      const systemPrompt = `You are a ${
        type === "work"
          ? "workplace wellness expert"
          : "professional fitness trainer"
      }. 
      
      CRITICAL: Your response must be ONLY this exact JSON structure:
      {
        "title": "string (workout title)",
        "exercises": [
          {
            "name": "string (exercise name)",
            "description": "string (clear instructions)",
            "target_areas": ["string"],
            "is_work_friendly": ${type === "work"},
            ${
              type === "work"
                ? `"duration_minutes": number (1-5)`
                : `"sets": number,
                  "reps": number,
                  "equipment_needed": string[]`
            }
          }
        ]
      }

      Here's an example response:
      {
        "title": "${
          type === "work" ? "Quick Office Stretches" : "Full Body Workout"
        }",
        "exercises": [
          {
            "name": "${
              type === "work" ? "Desk Shoulder Rolls" : "Bodyweight Squats"
            }",
            "description": "${
              type === "work"
                ? "Roll shoulders backward and forward 10 times each direction"
                : "Stand with feet shoulder-width apart, lower body until thighs are parallel to ground"
            }",
            "target_areas": ["${type === "work" ? "shoulders" : "legs"}"],
            "is_work_friendly": ${type === "work"},
            ${
              type === "work"
                ? `"duration_minutes": 2`
                : `"sets": 3,
                  "reps": 12,
                  "equipment_needed": ["none"]`
            }
          }
        ]
      }

      Convert this workout plan into the JSON format: ${JSON.stringify(
        structuredWorkout
      )}`;

      // Generate workout with appropriate exercises
      const response = await safeGenerateAIResponse(
        JSON.stringify(structuredWorkout),
        systemPrompt
      );

      if (!response?.content) {
        throw new Error("No response from AI");
      }

      // Clean the response to ensure it's valid JSON
      const cleanedContent = response.content
        .trim()
        .replace(/```json\n?|\n?```/g, "")
        .replace(/\*\*/g, "");

      try {
        const parsed = JSON.parse(cleanedContent);

        if (!parsed.title || !Array.isArray(parsed.exercises)) {
          throw new Error("Invalid workout format");
        }

        const workoutPlan: WorkoutPlan = {
          title: parsed.title,
          exercises: parsed.exercises.map((ex) => ({
            id: generateId(),
            name: ex.name,
            description: ex.description.trim(),
            sets: ex.sets || (type === "work" ? undefined : 3),
            reps: ex.reps || (type === "work" ? undefined : 10),
            duration_minutes:
              type === "work" ? ex.duration_minutes || 5 : undefined,
            target_areas: ex.target_areas || ["general"],
            is_work_friendly: type === "work",
            equipment_needed: ex.equipment_needed || [],
          })),
          type,
        };

        // Create workout with correct type
        const workout = await createWorkout(workoutPlan);
        if (!workout?.id) {
          throw new Error("Failed to create workout");
        }
        return workout;
      } catch (parseError) {
        console.error("Parse error:", parseError, "\nContent:", cleanedContent);
        // Create a more relevant fallback based on the user's input
        const fallbackWorkout = await createWorkout({
          title: `${type === "work" ? "Office" : "Exercise"} Routine`,
          exercises: [
            {
              id: generateId(),
              name: prompt.split(/[.,\n]/)[0]?.trim() || "Basic Exercise",
              description:
                prompt.trim() || "Simple exercise based on your request",
              duration_minutes: type === "work" ? 5 : undefined,
              sets: type === "work" ? undefined : 3,
              reps: type === "work" ? undefined : 10,
              target_areas: ["general"],
              is_work_friendly: type === "work",
              equipment_needed: [],
            },
          ],
          type,
        });

        if (!fallbackWorkout?.id) {
          throw new Error("Failed to create fallback workout");
        }
        return fallbackWorkout;
      }
    } catch (error) {
      console.error("Error generating workout:", error);
      throw error;
    }
  };

  const isPredefinedProfession = (professionName: string): boolean => {
    return PROFESSIONS.some(
      (p) => p.name.toLowerCase() === professionName.toLowerCase()
    );
  };

  const analyzeNewProfession = async (professionName: string) => {
    // First check if this is a predefined profession
    const predefinedProfession = PROFESSIONS.find(
      (p) => p.name.toLowerCase() === professionName.toLowerCase()
    );

    if (predefinedProfession) {
      // Return the predefined data instead of making an AI call
      return {
        success: true,
        data: predefinedProfession,
      };
    }

    // Only make AI call for non-predefined professions
    const systemPrompt = `You are a professional job analyst. Analyze the given profession and return ONLY a JSON object in this exact format:
    {
      "category": "string",
      "characteristics": {
        "physical_demands": ["string"],
        "workplace": ["string"],
        "movements": ["string"]
      },
      "health_risks": ["string"],
      "exercise_recommendations": {
        "types": ["string"],
        "frequency": "string",
        "focus_areas": ["string"]
      }
    }

    DO NOT include any explanatory text. ONLY return the JSON object.`;

    const response = await safeGenerateAIResponse(
      `Analyze this profession: ${professionName}`,
      systemPrompt
    );

    if (!response?.content) return null;

    try {
      // Clean the response to ensure it's valid JSON
      const cleanedContent = response.content
        .trim()
        .replace(/```json\n?|\n?```/g, "")
        .replace(/^\s*[\r\n]/gm, "");

      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error("Error parsing profession analysis:", error);
      // Return a default analysis structure
      return {
        category: "custom",
        characteristics: {
          physical_demands: ["unknown"],
          workplace: ["unknown"],
          movements: ["unknown"],
        },
        health_risks: ["unknown"],
        exercise_recommendations: {
          types: ["general exercise"],
          frequency: "regular breaks",
          focus_areas: ["general health"],
        },
      };
    }
  };

  const getFeedbackForProfession = async (
    professionName: string
  ): Promise<AIResponse> => {
    setIsLoading(true);
    try {
      const professionData = PROFESSIONS.find((p) => p.name === professionName);

      if (!professionData) {
        throw new Error("Invalid profession");
      }

      // Simulate AI feedback generation
      const feedback: AIResponse = {
        content: `As a ${professionName}, you should focus on exercises that address: ${professionData.common_issues
          .map((issue) => issue.issue)
          .join(
            ", "
          )}. Recommended exercises include: ${professionData.recommended_exercises
          .map((exercise) => exercise.name)
          .join(", ")}.`,
        tokenUsage: 0,
      };

      return feedback;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AITrainerContext.Provider
      value={{
        getWorkoutRecommendation,
        getMotivationalMessage,
        analyzeProgress,
        safeGenerateAIResponse,
        isLoading,
        error,
        clearError,
        generateWorkoutPlan,
        analyzeNewProfession,
        getFeedbackForProfession,
      }}
    >
      {children}
    </AITrainerContext.Provider>
  );
}

export const useAITrainer = () => {
  const context = useContext(AITrainerContext);
  if (context === undefined) {
    throw new Error("useAITrainer must be used within an AITrainerProvider");
  }
  return context;
};
