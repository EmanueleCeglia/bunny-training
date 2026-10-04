import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { OPENAI_MODEL, requireEnv } from "./env";
import {
  REGION_LABELS,
  catalogById,
  catalogByName,
  catalogFor,
  type CatalogExercise,
  type Region,
} from "./catalog";
import {
  DIFFICULTY_LABELS,
  FOCUS_LABELS,
  LOCATION_LABELS,
  type ExerciseKind,
  type Focus,
  type TrainingLocation,
} from "./types";

/** What gets stored: the trainer picks an id, the catalog supplies name and kind. */
export type PlannedExercise = {
  name: string;
  sets: number;
  reps: string;
  rest_sec: number;
  kind: ExerciseKind;
  coach_note: string;
};

export type WorkoutPlan = {
  title: string;
  summary: string;
  exercises: PlannedExercise[];
};

export type RevisedPlan = WorkoutPlan & { change_note: string };

/**
 * The id is an enum of today's menu, so structured output makes it
 * impossible for the model to invent an exercise.
 */
function pickSchema(menu: CatalogExercise[]) {
  return z.object({
    exercise_id: z.enum(menu.map((exercise) => exercise.id)),
    sets: z.number().int(),
    reps: z.string(),
    rest_sec: z.number().int(),
    coach_note: z.string(),
  });
}

type Pick = z.infer<ReturnType<typeof pickSchema>>;
type RawPlan = { title: string; summary: string; exercises: Pick[] };

function planSchema(menu: CatalogExercise[]) {
  return z.object({
    title: z.string(),
    summary: z.string(),
    exercises: z.array(pickSchema(menu)),
  });
}

function revisedSchema(menu: CatalogExercise[]) {
  return planSchema(menu).extend({ change_note: z.string() });
}

const SYSTEM_PROMPT = `You are Bunny's personal trainer. Bunny is a woman who trains on her own, either at a commercial gym or at home. She trains for health and to feel good, not to compete.

Hard rules:
- Only use exercises from the menu given in the request, referring to each by its id. Never invent an exercise.
- At HOME she has her bodyweight, the floor, a chair, a wall and ONE dumbbell of up to 10 kg. Moves marked "one dumbbell" use that single dumbbell; never ask for a second one.
- At the GYM she has the usual machines, dumbbells, cables and benches.
- The session must realistically fit the minutes given, including warm-up, rest between sets and a short cool-down. Fewer good exercises beats a rushed list.
- Always open with one or two warm-up moves (from Warm-up, or an easy Cardio move) and close with one or two Cool-down stretches, counted inside the time budget.
- Respect the requested focus. Core and cardio are seasoning, not the main course: on an upper or lower day most of the work should be in that region.
- Difficulty is 1 to 5. Each move has a level from 1 (beginner friendly) to 3 (demanding). At difficulty 1-2 lean on level 1 moves; at 4-5 bring in level 2 and 3. Also scale with sets, reps, tempo and rest. Never add unsafe load or risky movements.
- At home the dumbbell tops out at 10 kg, so make dumbbell moves harder with reps, slower tempo and pauses rather than weight.
- Vary the exercises against her recent sessions so training does not get repetitive or overwork the same muscles two days running.
- Never use the same exercise twice in one session.

Style:
- "reps" is free text holding only the count or time: "10-12", "30 seconds", "8 per leg". Use "per leg" or "per side" only for moves done one side at a time. Never put equipment in it.
- "coach_note" is one short, warm, practical cue about form or effort. Address her directly. No emoji.
- "title" is a short, cheerful name for the session, maximum four words.
- "summary" is one sentence telling her what this session does for her.
- When a "change_note" is asked for, it is one warm sentence under 25 words telling her what you just changed. No emoji, no lists.`;

const REGION_ORDER: Region[] = [
  "warmup",
  "upper",
  "core",
  "lower",
  "cardio",
  "cooldown",
];

function describeMenu(
  menu: CatalogExercise[],
  location: TrainingLocation,
): string {
  return REGION_ORDER.map((region) => {
    const lines = menu
      .filter((exercise) => exercise.region === region)
      .map((exercise) => {
        const tags = [`level ${exercise.level}`];
        if (location === "home" && exercise.dumbbell) tags.push("one dumbbell");
        return `- ${exercise.id}: ${exercise.name} (${tags.join(", ")})`;
      });
    return lines.length ? `${REGION_LABELS[region]}\n${lines.join("\n")}` : "";
  })
    .filter(Boolean)
    .join("\n\n");
}

function toPlanned(pick: Pick, entry: CatalogExercise): PlannedExercise {
  return {
    name: entry.name,
    sets: pick.sets,
    reps: pick.reps,
    rest_sec: pick.rest_sec,
    kind: entry.kind,
    coach_note: pick.coach_note,
  };
}

/** Resolves ids back to catalog names and drops any repeat the model slipped in. */
function toPlan(raw: RawPlan): WorkoutPlan {
  const seen = new Set<string>();
  const exercises: PlannedExercise[] = [];
  for (const pick of raw.exercises) {
    const entry = catalogById(pick.exercise_id);
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    exercises.push(toPlanned(pick, entry));
  }
  if (exercises.length === 0) {
    throw new Error("The trainer came back empty-handed. Try again.");
  }
  return { title: raw.title, summary: raw.summary, exercises };
}

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

async function request<T>(
  schema: Parameters<typeof zodTextFormat>[0],
  name: string,
  userPrompt: string,
): Promise<T> {
  const response = await openai().responses.parse({
    model: OPENAI_MODEL,
    ...reasoningOption,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    text: { format: zodTextFormat(schema, name) },
  });

  const parsed = response.output_parsed as T | null;
  if (!parsed) throw new Error("The trainer came back empty-handed. Try again.");
  return parsed;
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
  const menu = catalogFor(input.location, input.focus);
  const recent = input.recentSummaries.length
    ? `\nHer recent sessions, newest first:\n${input.recentSummaries.map((line) => `- ${line}`).join("\n")}`
    : "\nThis is her first logged session.";

  const raw = await request<RawPlan>(
    planSchema(menu),
    "workout_plan",
    `Build today's session.
Place: ${LOCATION_LABELS[input.location]}
Time available: ${input.durationMin} minutes
Focus: ${FOCUS_LABELS[input.focus]}
Difficulty: ${input.difficulty} of 5 (${DIFFICULTY_LABELS[input.difficulty]})${recent}

Today's menu:
${describeMenu(menu, input.location)}`,
  );
  return toPlan(raw);
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
  const menu = catalogFor(input.location, input.focus);
  const current = {
    title: input.currentPlan.title,
    summary: input.currentPlan.summary,
    exercises: input.currentPlan.exercises.map((exercise) => ({
      exercise_id: catalogByName(exercise.name)?.id ?? null,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      rest_sec: exercise.rest_sec,
      coach_note: exercise.coach_note,
    })),
  };

  const raw = await request<RawPlan & { change_note: string }>(
    revisedSchema(menu),
    "workout_plan",
    `Revise this session and return the complete updated plan.
Place: ${LOCATION_LABELS[input.location]}
Time available: ${input.durationMin} minutes
Focus: ${FOCUS_LABELS[input.focus]}
Target difficulty: ${input.difficulty} of 5 (${DIFFICULTY_LABELS[input.difficulty]})

Current plan (an exercise_id of null means it is not on the menu and must be replaced with one that is):
${JSON.stringify(current, null, 2)}

What she asked for:
"${input.instruction}"

Keep everything she did not ask you to change. Keep the session inside the time budget.
If she asks for something that is not on the menu, pick the closest exercise that is.
Also set "change_note" to one warm sentence telling her what you changed.

Today's menu:
${describeMenu(menu, input.location)}`,
  );
  return { ...toPlan(raw), change_note: raw.change_note };
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
  const taken = new Set(
    [...input.keeping, input.replacing.name].map((name) => name.toLowerCase()),
  );
  const available = catalogFor(input.location, input.focus).filter(
    (exercise) => !taken.has(exercise.name.toLowerCase()),
  );
  const region = catalogByName(input.replacing.name)?.region;
  const sameRegion = available.filter((exercise) => exercise.region === region);
  const menu = sameRegion.length ? sameRegion : available;
  if (menu.length === 0) throw new Error("Nothing left to swap in.");

  const pick = await request<Pick>(
    pickSchema(menu),
    "exercise",
    `Swap out one exercise and return only its replacement.
Place: ${LOCATION_LABELS[input.location]}
Session focus: ${FOCUS_LABELS[input.focus]}
Difficulty: ${input.difficulty} of 5 (${DIFFICULTY_LABELS[input.difficulty]})

Replace: ${input.replacing.name} (${input.replacing.sets} × ${input.replacing.reps})

Pick the exercise from the menu that best trains the same muscles for roughly the same time, and give it a similar set and rep scheme.

Menu:
${describeMenu(menu, input.location)}`,
  );

  const entry = catalogById(pick.exercise_id);
  if (!entry) throw new Error("Could not find a swap. Try again.");
  return toPlanned(pick, entry);
}
