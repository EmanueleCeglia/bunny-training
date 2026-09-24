export type TrainingLocation = "gym" | "home";
export type Focus = "full_body" | "upper" | "lower";
export type ExerciseKind =
  | "machine"
  | "free_weight"
  | "bodyweight"
  | "cardio"
  | "stretch";

export type Exercise = {
  id: string;
  workout_id: string;
  position: number;
  name: string;
  sets: number | null;
  reps: string | null;
  rest_sec: number | null;
  kind: ExerciseKind | null;
  coach_note: string | null;
  done: boolean;
};

export type Workout = {
  id: string;
  created_at: string;
  workout_date: string;
  location: TrainingLocation;
  duration_min: number;
  focus: Focus;
  difficulty: number;
  title: string;
  summary: string | null;
  status: "planned" | "completed";
  completed_at: string | null;
  notes: string | null;
};

export type WorkoutWithExercises = Workout & { exercises: Exercise[] };

export type Message = {
  id: string;
  workout_id: string;
  created_at: string;
  role: "user" | "assistant";
  content: string;
};

export const FOCUS_LABELS: Record<Focus, string> = {
  full_body: "Full body",
  upper: "Upper body",
  lower: "Lower body",
};

export const LOCATION_LABELS: Record<TrainingLocation, string> = {
  gym: "Gym",
  home: "Home",
};

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Very easy",
  2: "Easy",
  3: "Normal",
  4: "Hard",
  5: "Very hard",
};
