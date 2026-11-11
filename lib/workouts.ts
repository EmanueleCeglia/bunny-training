import { db } from "./db";
import { todayISO } from "./date";
import type { PastSession } from "./program";
import type { ProgressRow } from "./progress";
import type {
  Exercise,
  Feel,
  Focus,
  Message,
  PlannedExercise,
  TrainingLocation,
  Workout,
  WorkoutPlan,
  WorkoutWithExercises,
} from "./types";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export async function listWorkouts(): Promise<Workout[]> {
  return unwrap(
    await db()
      .from("workouts")
      .select("*")
      .order("workout_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
  );
}

export async function getWorkout(
  id: string,
): Promise<WorkoutWithExercises | null> {
  const workout = unwrap(
    await db().from("workouts").select("*").eq("id", id).maybeSingle(),
  ) as Workout | null;
  if (!workout) return null;

  const exercises = unwrap(
    await db()
      .from("exercises")
      .select("*")
      .eq("workout_id", id)
      .order("position"),
  ) as Exercise[];

  return { ...workout, exercises };
}

export async function getTodayWorkout(): Promise<WorkoutWithExercises | null> {
  const rows = unwrap(
    await db()
      .from("workouts")
      .select("id")
      .eq("workout_date", todayISO())
      .order("created_at", { ascending: false })
      .limit(1),
  ) as { id: string }[];

  return rows.length ? getWorkout(rows[0].id) : null;
}

export async function getMessages(workoutId: string): Promise<Message[]> {
  return unwrap(
    await db()
      .from("messages")
      .select("*")
      .eq("workout_id", workoutId)
      .order("created_at"),
  );
}

export async function addMessage(
  workoutId: string,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  unwrap(
    await db()
      .from("messages")
      .insert({ workout_id: workoutId, role, content })
      .select("id"),
  );
}

/** Her latest sessions, newest first, with what was in them and what she ticked. */
export async function sessionHistory(limit = 12): Promise<PastSession[]> {
  const rows = unwrap(
    await db()
      .from("workouts")
      .select("*, exercises(name, sets, reps, done)")
      .order("workout_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit),
  ) as (Workout & { exercises: PastSession["exercises"] })[];

  return rows.map((row) => ({
    id: row.id,
    date: row.workout_date,
    location: row.location,
    focus: row.focus,
    durationMin: row.duration_min,
    difficulty: row.difficulty,
    completed: row.status === "completed",
    feel: row.feel ?? null,
    title: row.title,
    exercises: row.exercises,
  }));
}

export async function progressRows(): Promise<ProgressRow[]> {
  return unwrap(
    await db()
      .from("workouts")
      .select(
        "id, workout_date, completed_at, status, location, focus, duration_min, exercises(done)",
      )
      .order("workout_date", { ascending: false })
      .limit(1000),
  );
}

export async function createWorkout(
  params: {
    location: TrainingLocation;
    durationMin: number;
    focus: Focus;
    difficulty: number;
  },
  plan: WorkoutPlan,
): Promise<string> {
  const workout = unwrap(
    await db()
      .from("workouts")
      .insert({
        workout_date: todayISO(),
        location: params.location,
        duration_min: params.durationMin,
        focus: params.focus,
        difficulty: params.difficulty,
        title: plan.title,
        summary: plan.summary,
      })
      .select("id")
      .single(),
  ) as { id: string };

  await writeExercises(workout.id, plan);
  return workout.id;
}

/** Replaces the plan. An exercise that survives the rewrite keeps its tick. */
export async function writeExercises(
  workoutId: string,
  plan: WorkoutPlan,
): Promise<void> {
  const before = unwrap(
    await db().from("exercises").select("name, done").eq("workout_id", workoutId),
  ) as { name: string; done: boolean }[];
  const ticked = new Set(before.filter((e) => e.done).map((e) => e.name));

  const remove = await db().from("exercises").delete().eq("workout_id", workoutId);
  if (remove.error) throw new Error(remove.error.message);

  const insert = await db()
    .from("exercises")
    .insert(
      plan.exercises.map((exercise, index) => ({
        workout_id: workoutId,
        position: index,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_sec: exercise.rest_sec,
        kind: exercise.kind,
        coach_note: exercise.coach_note,
        done: ticked.has(exercise.name),
      })),
    );
  if (insert.error) throw new Error(insert.error.message);

  const update = await db()
    .from("workouts")
    .update({ title: plan.title, summary: plan.summary })
    .eq("id", workoutId);
  if (update.error) throw new Error(update.error.message);
}

export async function getExerciseContext(
  exerciseId: string,
): Promise<{ exercise: Exercise; workout: WorkoutWithExercises } | null> {
  const exercise = unwrap(
    await db().from("exercises").select("*").eq("id", exerciseId).maybeSingle(),
  ) as Exercise | null;
  if (!exercise) return null;

  const workout = await getWorkout(exercise.workout_id);
  return workout ? { exercise, workout } : null;
}

/** Updates in place so the row keeps its id and its spot in the list. */
export async function replaceExercise(
  exerciseId: string,
  planned: PlannedExercise,
): Promise<void> {
  const result = await db()
    .from("exercises")
    .update({
      name: planned.name,
      sets: planned.sets,
      reps: planned.reps,
      rest_sec: planned.rest_sec,
      kind: planned.kind,
      coach_note: planned.coach_note,
      done: false,
    })
    .eq("id", exerciseId);
  if (result.error) throw new Error(result.error.message);
}

export async function setSummary(
  workoutId: string,
  summary: string,
): Promise<void> {
  const result = await db()
    .from("workouts")
    .update({ summary })
    .eq("id", workoutId);
  if (result.error) throw new Error(result.error.message);
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const result = await db().from("workouts").delete().eq("id", workoutId);
  if (result.error) throw new Error(result.error.message);
}

export async function setExerciseDone(
  exerciseId: string,
  done: boolean,
): Promise<void> {
  const result = await db()
    .from("exercises")
    .update({ done })
    .eq("id", exerciseId);
  if (result.error) throw new Error(result.error.message);
}

export async function setDifficulty(
  workoutId: string,
  difficulty: number,
): Promise<void> {
  const result = await db()
    .from("workouts")
    .update({ difficulty })
    .eq("id", workoutId);
  if (result.error) throw new Error(result.error.message);
}

export async function setFeel(workoutId: string, feel: Feel): Promise<void> {
  const result = await db().from("workouts").update({ feel }).eq("id", workoutId);
  if (result.error) throw new Error(result.error.message);
}

/**
 * Marks the session done and draws a phrase she has not seen recently.
 * `everything` ticks every exercise first, for when she trained without
 * touching her phone.
 */
export async function completeWorkout(
  workoutId: string,
  everything = false,
): Promise<string> {
  if (everything) {
    const tick = await db()
      .from("exercises")
      .update({ done: true })
      .eq("workout_id", workoutId);
    if (tick.error) throw new Error(tick.error.message);
  }

  const existing = unwrap(
    await db()
      .from("unlocks")
      .select("phrases(body)")
      .eq("workout_id", workoutId)
      .maybeSingle(),
  ) as { phrases: { body: string } } | null;

  if (existing) return existing.phrases.body;

  const recent = unwrap(
    await db()
      .from("unlocks")
      .select("phrase_id")
      .order("unlocked_at", { ascending: false })
      .limit(15),
  ) as { phrase_id: string }[];

  const excluded = recent.map((row) => row.phrase_id);
  let pool = unwrap(
    await db()
      .from("phrases")
      .select("id, body")
      .not("id", "in", `(${excluded.join(",")})`),
  ) as { id: string; body: string }[];

  if (excluded.length === 0 || pool.length === 0) {
    pool = unwrap(await db().from("phrases").select("id, body")) as {
      id: string;
      body: string;
    }[];
  }
  if (pool.length === 0) {
    throw new Error("No encouragement phrases in the database yet.");
  }

  const phrase = pool[Math.floor(Math.random() * pool.length)];

  const update = await db()
    .from("workouts")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", workoutId);
  if (update.error) throw new Error(update.error.message);

  const unlock = await db()
    .from("unlocks")
    .insert({ workout_id: workoutId, phrase_id: phrase.id });
  if (unlock.error) throw new Error(unlock.error.message);

  return phrase.body;
}

export async function getUnlockedPhrase(
  workoutId: string,
): Promise<string | null> {
  const row = unwrap(
    await db()
      .from("unlocks")
      .select("phrases(body)")
      .eq("workout_id", workoutId)
      .maybeSingle(),
  ) as { phrases: { body: string } } | null;
  return row?.phrases.body ?? null;
}
