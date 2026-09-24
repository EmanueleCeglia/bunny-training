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

export type WorkoutPlan = z.infer<typeof WorkoutPlan>;
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
- "summary" is one sentence telling her what this session does for her.`;

let client: OpenAI | null = null;
function openai(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  return client;
}

async function requestPlan(userPrompt: string): Promise<WorkoutPlan> {
  const response = await openai().responses.parse({
    model: OPENAI_MODEL,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    text: { format: zodTextFormat(WorkoutPlan, "workout_plan") },
  });

  const plan = response.output_parsed;
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

  return requestPlan(
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
): Promise<WorkoutPlan> {
  return requestPlan(
    `Revise this session and return the complete updated plan.
Place: ${LOCATION_LABELS[input.location]}
Time available: ${input.durationMin} minutes
Focus: ${FOCUS_LABELS[input.focus]}
Target difficulty: ${input.difficulty} of 5 (${DIFFICULTY_LABELS[input.difficulty]})

Current plan:
${JSON.stringify(input.currentPlan, null, 2)}

What she asked for:
"${input.instruction}"

Keep everything she did not ask you to change. Keep the session inside the time budget.`,
  );
}

/** One short sentence confirming what changed, shown in the chat thread. */
export async function describeChange(
  instruction: string,
  plan: WorkoutPlan,
): Promise<string> {
  const response = await openai().responses.create({
    model: OPENAI_MODEL,
    input: [
      {
        role: "system",
        content:
          "You are Bunny's trainer. In one warm sentence, under 25 words, tell her what you changed in her workout. No emoji, no lists.",
      },
      {
        role: "user",
        content: `She asked: "${instruction}"\nThe new plan is: ${plan.exercises.map((e) => e.name).join(", ")}`,
      },
    ],
  });
  return response.output_text.trim();
}
