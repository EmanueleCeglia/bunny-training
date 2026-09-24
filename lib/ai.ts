import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { OPENAI_MODEL, requireEnv } from "./env";
import {
  DIFFICULTY_LABELS,
  FOCUS_LABELS,
  LOCATION_LABELS,
  type Focus,
  type TrainingLocation,
} from "./types";

const PlannedExercise = z.object({
  name: z.string(),
  sets: z.number().int(),
  reps: z.string(),
  rest_sec: z.number().int(),
  kind: z.enum(["machine", "free_weight", "bodyweight", "cardio", "stretch"]),
  coach_note: z.string(),
});

const WorkoutPlan = z.object({
  title: z.string(),
  summary: z.string(),
  exercises: z.array(PlannedExercise),
});

/** The revision also explains itself, so one call does the work of two. */
const RevisedPlan = WorkoutPlan.extend({
  change_note: z.string(),
});

export type WorkoutPlan = z.infer<typeof WorkoutPlan>;
export type RevisedPlan = z.infer<typeof RevisedPlan>;
export type PlannedExercise = z.infer<typeof PlannedExercise>;

const SYSTEM_PROMPT = `You are Bunny's personal trainer. Bunny is a woman who trains on her own, either at a commercial gym or at home.

Hard rules:
- At HOME she owns no equipment at all. Bodyweight, floor work, a chair or a wall only. Never suggest dumbbells, bands, a mat-dependent machine or anything she would have to buy.
- At the GYM she has the usual machines, barbells, dumbbells, cables and benches.
- The session must realistically fit the minutes given, including warm-up, rest between sets and a short cool-down. Fewer good exercises beats a rushed list.
- Always open with a brief warm-up and close with a stretch or cool-down, counted inside the time budget.
- Respect the requested focus: full body, upper body or lower body.
- Difficulty is 1 to 5. Scale it with volume, tempo, rest length and exercise variation, never by adding unsafe load or risky movements.
- Vary the exercises against her recent sessions so training does not get repetitive or overwork the same muscles two days running.

Style:
- Write exercise names the way they are said in a gym, in English.
- "reps" is free text: "10-12", "30 seconds", "8 per leg".
- "coach_note" is one short, warm, practical cue about form or effort. Address her directly. No emoji.
- "title" is a short, cheerful name for the session, maximum four words.
- "summary" is one sentence telling her what this session does for her.
- When a "change_note" is asked for, it is one warm sentence under 25 words telling her what you just changed. No emoji, no lists.`;

let client: OpenAI | null = null;
function openai(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  return client;
}

// Default reasoning effort pushes a single request past 35 seconds, which is
// both a bad wait and close to the Vercel function ceiling.
const reasoningOption = OPENAI_MODEL.startsWith("gpt-5")
  ? { reasoning: { effort: "minimal" as const } }
  : {};

async function requestPlan<T extends WorkoutPlan>(
  schema: Parameters<typeof zodTextFormat>[0],
  userPrompt: string,
): Promise<T> {
  const response = await openai().responses.parse({
    model: OPENAI_MODEL,
    ...reasoningOption,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    text: { format: zodTextFormat(schema, "workout_plan") },
  });

  const plan = response.output_parsed as T | null;
  if (!plan || plan.exercises.length === 0) {
    throw new Error("The trainer came back empty-handed. Try again.");
  }
  return plan;
}

export type GenerateInput = {
  location: TrainingLocation;
  durationMin: number;
  focus: Focus;
  difficulty: number;
  recentSummaries: string[];
};

export async function generateWorkout(
  input: GenerateInput,
): Promise<WorkoutPlan> {
  const recent = input.recentSummaries.length
    ? `\nHer recent sessions, newest first:\n${input.recentSummaries.map((line) => `- ${line}`).join("\n")}`
    : "\nThis is her first logged session.";

  return requestPlan<WorkoutPlan>(
    WorkoutPlan,
    `Build today's session.
Place: ${LOCATION_LABELS[input.location]}
Time available: ${input.durationMin} minutes
Focus: ${FOCUS_LABELS[input.focus]}
Difficulty: ${input.difficulty} of 5 (${DIFFICULTY_LABELS[input.difficulty]})${recent}`,
  );
}

export type ReviseInput = {
  location: TrainingLocation;
  durationMin: number;
  focus: Focus;
  difficulty: number;
  currentPlan: WorkoutPlan;
  instruction: string;
};

export async function reviseWorkout(
  input: ReviseInput,
): Promise<RevisedPlan> {
  return requestPlan<RevisedPlan>(
    RevisedPlan,
    `Revise this session and return the complete updated plan.
Place: ${LOCATION_LABELS[input.location]}
Time available: ${input.durationMin} minutes
Focus: ${FOCUS_LABELS[input.focus]}
Target difficulty: ${input.difficulty} of 5 (${DIFFICULTY_LABELS[input.difficulty]})

Current plan:
${JSON.stringify(input.currentPlan, null, 2)}

What she asked for:
"${input.instruction}"

Keep everything she did not ask you to change. Keep the session inside the time budget.
Also set "change_note" to one warm sentence telling her what you changed.`,
  );
}

export type SwapInput = {
  location: TrainingLocation;
  focus: Focus;
  difficulty: number;
  replacing: PlannedExercise;
  keeping: string[];
};

/** Replaces a single exercise, for when a machine is taken or something hurts. */
export async function swapExercise(
  input: SwapInput,
): Promise<PlannedExercise> {
  const response = await openai().responses.parse({
    model: OPENAI_MODEL,
    ...reasoningOption,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Swap out one exercise and return only its replacement.
Place: ${LOCATION_LABELS[input.location]}
Session focus: ${FOCUS_LABELS[input.focus]}
Difficulty: ${input.difficulty} of 5 (${DIFFICULTY_LABELS[input.difficulty]})

Replace: ${input.replacing.name} (${input.replacing.sets} × ${input.replacing.reps})

The rest of the session, which must not be duplicated:
${input.keeping.map((name) => `- ${name}`).join("\n")}

Pick a different exercise that trains the same muscles for roughly the same time, and give it a similar set and rep scheme. It must not be one of the exercises listed above.`,
      },
    ],
    text: { format: zodTextFormat(PlannedExercise, "exercise") },
  });

  const exercise = response.output_parsed;
  if (!exercise) throw new Error("Could not find a swap. Try again.");
  return exercise;
}
