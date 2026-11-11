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
  buildSlots,
  fitToTime,
  prescriptionGuide,
  rolesFor,
  schemeFor,
  shuffled,
  type PastSession,
  type Role,
  type SessionContext,
  type Slot,
} from "./program";
import {
  DIFFICULTY_LABELS,
  FOCUS_LABELS,
  LOCATION_LABELS,
  type Focus,
  type PlannedExercise,
  type WorkoutPlan,
} from "./types";

export type RevisedPlan = WorkoutPlan & { change_note: string };

/**
 * The id is an enum of the options on offer, so structured output makes it
 * impossible for the model to invent an exercise.
 */
function pickSchema(options: CatalogExercise[]) {
  return z.object({
    exercise_id: z.enum(options.map((exercise) => exercise.id)),
    sets: z.number().int(),
    reps: z.string(),
    rest_sec: z.number().int(),
    coach_note: z.string(),
  });
}

/** Warm-ups and stretches are timed by the app, so the model only chooses and coaches. */
function cueSchema(options: CatalogExercise[]) {
  return z.object({
    exercise_id: z.enum(options.map((exercise) => exercise.id)),
    coach_note: z.string(),
  });
}

type Pick = z.infer<ReturnType<typeof pickSchema>>;
type Cue = z.infer<ReturnType<typeof cueSchema>>;

const APP_TIMED: Role[] = ["warmup", "cooldown"];

/**
 * One required key per slot, each with its own options. The count, the order,
 * the main lifts and "no exercise twice" all hold by construction. The summary
 * comes last so it is written about a session that already exists.
 */
function sessionSchema(slots: Slot[]) {
  return z.object({
    ...Object.fromEntries(
      slots.map((slot) => [
        slot.key,
        APP_TIMED.includes(slot.role)
          ? cueSchema(slot.options)
          : pickSchema(slot.options),
      ]),
    ),
    summary: z.string(),
  });
}

function revisedSchema(menu: CatalogExercise[]) {
  return z.object({
    exercises: z.array(pickSchema(menu)),
    summary: z.string(),
    change_note: z.string(),
  });
}

const SYSTEM_PROMPT = `You are the personal trainer inside a small app that was made as a gift for a woman everyone calls Bunny, and so do you. She trains alone, at a commercial gym or at home, for her health and to feel good. She is not an athlete and does not want to be talked to like one.

The app has already decided the shape of the session: how many exercises, which main lifts, and a short list of options for every other slot. Your job is the part that needs a trainer's judgement.

Choosing
- Fill every slot with exactly one exercise from that slot's own options.
- Build a session that hangs together. Look at the main lifts first, then choose accessories that train something those lifts miss rather than repeating the same movement.
- Warm up the joints today's lifts use. Stretch the muscles today's lifts worked.
- When two options are equally good, take the one that is kinder to learn.

Prescribing
- Follow the numbers in "How to prescribe today". They are already adjusted to her level and to the time she has, so do not improvise different ones.
- "reps" holds only a count or a time, such as "10-12" or "30 seconds". No equipment, no tempo, no extra words.
- For an option marked "each side", give the count or time for one side and do not write "per side" yourself; the app adds it.
- A main lift she has done before starts from last time's numbers: give the same, or one small step more. A small step is a couple more reps or one more set, never both.

coach_note
- One sentence of at most 16 words, said to her directly.
- Give one cue she can feel: name a body part and what to do with it, the way a trainer standing next to her would.
- Use everyday words for the body: "outer hips" and "back of your thighs", never anatomy terms like "gluteus medius".
- Never write generic advice such as "keep good form", "engage your core" or "control the movement".
- The note is about how to do the move. Do not mention sets, reps or last time in it.
- No emoji and no exclamation marks.

summary
- One warm sentence of at most 30 words, said to her as "you". Name today's main lifts, then one specific thing in this session to look forward to, such as an accessory or how it finishes. Do not list the whole session.
- Do not open with "Main lifts are" or "Today".
- Never comment on her shape, her weight or how she looks.

When you are revising a session
- Change only what was asked and leave every other exercise and number exactly as it is.
- "change_note" is one warm sentence under 25 words saying what you changed. No emoji, no lists.`;

/**
 * Left to itself the model names every session alike, and pairing a sweet word
 * with a body part can land as a remark about her body. So titles are put
 * together here: a word she has not had lately, plus a name for the day.
 */
const TITLE_WORDS = [
  "Clover", "Honey", "Peach", "Tulip", "Velvet", "Sparkle", "Moonlight",
  "Cherry", "Daisy", "Sunshine", "Pepper", "Comet", "Cinnamon", "Meadow",
  "Strawberry", "Lavender", "Firefly", "Breeze", "Pearl", "Mango", "Glitter",
  "Sunrise", "Pebble", "Blossom", "Carrot", "Starlight", "Maple", "Poppy",
  "Willow", "Dewdrop", "Clementine", "Buttercup",
];

const TITLE_DAYS: Record<Focus, string[]> = {
  lower: ["Leg Day", "Glute Day", "Squat Day", "Hop", "Stride"],
  upper: ["Arm Day", "Shoulder Day", "Push & Pull", "Lift", "Reach"],
  full_body: ["Flow", "Mix", "Circuit", "All-Rounder", "Head to Toe"],
};

const pickOne = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

function sessionTitle(focus: Focus, recentTitles: string[]): string {
  const used = recentTitles.join(" ").toLowerCase();
  const unused = TITLE_WORDS.filter((word) => !used.includes(word.toLowerCase()));
  return `${pickOne(unused.length ? unused : TITLE_WORDS)} ${pickOne(TITLE_DAYS[focus])}`;
}

const REGION_ORDER: Region[] = [
  "warmup",
  "upper",
  "lower",
  "core",
  "cardio",
  "cooldown",
];

function optionLine(exercise: CatalogExercise, context: SessionContext) {
  const tags = [
    exercise.sides ? "each side" : null,
    context.location === "home" && exercise.dumbbell ? "one dumbbell" : null,
  ].filter(Boolean);
  return `  - ${exercise.id}: ${exercise.name}${tags.length ? ` (${tags.join(", ")})` : ""}`;
}

function describeSlots(slots: Slot[], context: SessionContext): string {
  return slots
    .map(
      (slot) =>
        `${slot.key}: ${slot.ask}\n${slot.options.map((exercise) => optionLine(exercise, context)).join("\n")}`,
    )
    .join("\n");
}

function describeMenu(menu: CatalogExercise[], context: SessionContext): string {
  return REGION_ORDER.map((region) => {
    const lines = menu
      .filter((exercise) => exercise.region === region)
      .map((exercise) => optionLine(exercise, context));
    return lines.length ? `${REGION_LABELS[region]}\n${lines.join("\n")}` : "";
  })
    .filter(Boolean)
    .join("\n");
}

function toPlanned(
  entry: CatalogExercise,
  role: Role,
  pick: Pick | Cue,
  context: SessionContext,
  strict: boolean,
): PlannedExercise {
  const scheme = schemeFor(
    entry,
    role,
    "reps" in pick ? pick : null,
    context,
    strict,
  );
  return {
    name: entry.name,
    sets: scheme.sets,
    reps: scheme.reps,
    rest_sec: scheme.rest,
    kind: entry.kind,
    coach_note: pick.coach_note.trim(),
  };
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

function header(context: SessionContext & { focus: Focus }, timed = true): string {
  return [
    `- Place: ${LOCATION_LABELS[context.location]}`,
    timed ? `- Time: ${context.durationMin} minutes` : null,
    `- Focus: ${FOCUS_LABELS[context.focus]}`,
    `- Difficulty: ${context.difficulty} of 5 (${DIFFICULTY_LABELS[context.difficulty]})`,
  ]
    .filter(Boolean)
    .join("\n");
}

export type GenerateInput = SessionContext & {
  focus: Focus;
  /** Her sessions, newest first. */
  history: PastSession[];
  dateISO: string;
};

export async function generateWorkout(
  input: GenerateInput,
): Promise<WorkoutPlan> {
  const slots = buildSlots(input);
  const titles = input.history.slice(0, 8).map((session) => session.title);
  const feel = input.history.find((session) => session.completed)?.feel;
  const mood =
    feel === "easy"
      ? "\n- Her last session felt too easy, so today is a notch harder. The summary can say she has earned it."
      : feel === "hard"
        ? "\n- Her last session felt too hard, so today is a notch gentler. The summary can be reassuring about that."
        : "";

  const raw = await request<Record<string, Pick | Cue> & { summary: string }>(
    sessionSchema(slots),
    "workout_plan",
    `Today's session
${header(input)}${mood}

How to prescribe today
${prescriptionGuide(input)}

Slots to fill, in workout order
${describeSlots(slots, input)}`,
  );

  const exercises = slots.map((slot) => {
    const pick = raw[slot.key];
    const entry = catalogById(pick.exercise_id) ?? slot.options[0];
    return toPlanned(entry, slot.role, pick, input, true);
  });

  return {
    title: sessionTitle(input.focus, titles),
    summary: raw.summary.trim(),
    exercises: fitToTime(exercises, input.durationMin),
  };
}

export type ReviseInput = SessionContext & {
  focus: Focus;
  currentPlan: WorkoutPlan;
  instruction: string;
};

export async function reviseWorkout(
  input: ReviseInput,
): Promise<RevisedPlan> {
  const menu = catalogFor(input.location, input.focus);
  const parts = rolesFor(input.currentPlan.exercises.map((e) => e.name));
  const current = input.currentPlan.exercises.map((exercise, index) => ({
    exercise_id: catalogByName(exercise.name)?.id ?? null,
    name: exercise.name,
    part: parts[index],
    sets: exercise.sets,
    reps: exercise.reps,
    rest_sec: exercise.rest_sec,
    coach_note: exercise.coach_note,
  }));

  const raw = await request<{
    exercises: Pick[];
    summary: string;
    change_note: string;
  }>(
    revisedSchema(menu),
    "workout_plan",
    `Revise this session and return the complete updated plan.
${header(input)}

How to prescribe at this difficulty
${prescriptionGuide(input)}

Current plan. An exercise_id of null is not on the menu and must be replaced with one that is.
${JSON.stringify(current, null, 2)}

What she asked for
"${input.instruction}"

Rules
- Keep the order: warm-up, main lifts, accessories, finishers, cool-down.
- Never use an exercise twice.
- If she asks for something that is not on the menu, use the closest thing that is.
- Write a fresh summary for the session as it now stands.

Menu
${describeMenu(menu, input)}`,
  );

  const entries: { entry: CatalogExercise; pick: Pick }[] = [];
  for (const pick of raw.exercises) {
    const entry = catalogById(pick.exercise_id);
    if (entry && !entries.some((other) => other.entry === entry)) {
      entries.push({ entry, pick });
    }
  }
  if (entries.length === 0) {
    throw new Error("The trainer came back empty-handed. Try again.");
  }

  const roles = rolesFor(entries.map(({ entry }) => entry.name));
  const exercises = entries.map(({ entry, pick }, index) =>
    toPlanned(entry, roles[index], pick, input, false),
  );

  return {
    title: input.currentPlan.title,
    summary: raw.summary.trim(),
    exercises: fitToTime(exercises, input.durationMin),
    change_note: raw.change_note.trim(),
  };
}

export type SwapInput = SessionContext & {
  focus: Focus;
  /** The whole session, in order. */
  session: PlannedExercise[];
  /** Position of the exercise to replace. */
  index: number;
};

/** Replaces a single exercise, for when a machine is taken or something hurts. */
export async function swapExercise(
  input: SwapInput,
): Promise<{ exercise: PlannedExercise; summary: string }> {
  const replacing = input.session[input.index];
  const taken = new Set(input.session.map((e) => e.name.toLowerCase()));
  const available = catalogFor(input.location, input.focus).filter(
    (exercise) => !taken.has(exercise.name.toLowerCase()),
  );
  const original = catalogByName(replacing.name);
  const samePattern = available.filter(
    (exercise) => original?.pattern && exercise.pattern === original.pattern,
  );
  const sameRegion = available.filter(
    (exercise) =>
      exercise.region === original?.region && exercise.area === original?.area,
  );
  const menu = shuffled(
    [samePattern, sameRegion, available].find((list) => list.length > 0) ?? [],
  );
  if (menu.length === 0) throw new Error("Nothing left to swap in.");

  const session = input.session
    .map((exercise, index) =>
      index === input.index ? "- (the replacement)" : `- ${exercise.name}`,
    )
    .join("\n");

  const pick = await request<Pick & { summary: string }>(
    pickSchema(menu).extend({ summary: z.string() }),
    "exercise",
    `Swap out one exercise and return its replacement.
${header(input, false)}

Replace: ${replacing.name} (${replacing.sets} × ${replacing.reps}, rest ${replacing.rest_sec}s)

Pick the option that trains the same muscles most closely, and give it the same sets and rest. Keep the reps the same too, unless the new move is timed.

Then write a fresh summary for the session with the replacement in it. The session, in order:
${session}

Options
${menu.map((exercise) => optionLine(exercise, input)).join("\n")}`,
  );

  const entry = catalogById(pick.exercise_id);
  if (!entry) throw new Error("Could not find a swap. Try again.");
  const role = rolesFor(input.session.map((e) => e.name))[input.index];
  return {
    exercise: toPlanned(entry, role, pick, input, true),
    summary: pick.summary.trim(),
  };
}
