import { Exercise } from "./database";

export type WorkoutPlan = {
  title: string;
  type: "work" | "exercise";
  exercises: Exercise[];
};

export type AIResponse = {
  content: string;
  tokenUsage: number;
  title?: string;
  exercises?: Exercise[];
  systemPrompt?: string;
  workoutPlan?: WorkoutPlan;
}; 