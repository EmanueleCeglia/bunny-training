import { z } from "zod";
import type { NextRequest } from "next/server";
import { guardApi } from "@/lib/guard";
import { reviseWorkout, type WorkoutPlan } from "@/lib/ai";
import {
  addMessage,
  getWorkout,
  setDifficulty,
  writeExercises,
} from "@/lib/workouts";

export const maxDuration = 60;

const Body = z.object({
  instruction: z.string().trim().min(1).max(500).optional(),
  difficultyDelta: z.union([z.literal(1), z.literal(-1)]).optional(),
});

const HARDER = "Make it harder.";
const EASIER = "Make it easier.";

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/workouts/[id]/revise">,
) {
  const denied = await guardApi();
  if (denied) return denied;

  const { id } = await context.params;
  const parsed = Body.safeParse(await request.json());
  if (!parsed.success || (!parsed.data.instruction && !parsed.data.difficultyDelta)) {
    return Response.json({ error: "Nothing to change" }, { status: 400 });
  }

  const workout = await getWorkout(id);
  if (!workout) return Response.json({ error: "Not found" }, { status: 404 });

  const delta = parsed.data.difficultyDelta;
  const difficulty = Math.min(5, Math.max(1, workout.difficulty + (delta ?? 0)));

  if (delta && difficulty === workout.difficulty) {
    return Response.json(
      { error: delta > 0 ? "Already at the hardest level" : "Already at the easiest level" },
      { status: 400 },
    );
  }

  const instruction =
    parsed.data.instruction ?? (delta === 1 ? HARDER : EASIER);

  const currentPlan: WorkoutPlan = {
    title: workout.title,
    summary: workout.summary ?? "",
    exercises: workout.exercises.map((exercise) => ({
      name: exercise.name,
      sets: exercise.sets ?? 3,
      reps: exercise.reps ?? "10",
      rest_sec: exercise.rest_sec ?? 60,
      kind: exercise.kind ?? "bodyweight",
      coach_note: exercise.coach_note ?? "",
    })),
  };

  try {
    const plan = await reviseWorkout({
      location: workout.location,
      durationMin: workout.duration_min,
      focus: workout.focus,
      difficulty,
      currentPlan,
      instruction,
    });

    await writeExercises(id, plan);
    if (difficulty !== workout.difficulty) await setDifficulty(id, difficulty);

    await addMessage(id, "user", instruction);
    await addMessage(id, "assistant", plan.change_note);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Revision failed" },
      { status: 500 },
    );
  }
}
