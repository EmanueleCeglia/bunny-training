import type { NextRequest } from "next/server";
import { guardApi } from "@/lib/guard";
import { swapExercise } from "@/lib/ai";
import {
  getExerciseContext,
  replaceExercise,
  setSummary,
} from "@/lib/workouts";

export const maxDuration = 60;

export async function POST(
  _request: NextRequest,
  context: RouteContext<"/api/exercises/[id]/swap">,
) {
  const denied = await guardApi();
  if (denied) return denied;

  const { id } = await context.params;
  const found = await getExerciseContext(id);
  if (!found) return Response.json({ error: "Not found" }, { status: 404 });

  const { workout } = found;

  try {
    const { exercise, summary } = await swapExercise({
      location: workout.location,
      focus: workout.focus,
      difficulty: workout.difficulty,
      durationMin: workout.duration_min,
      session: workout.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets ?? 3,
        reps: exercise.reps ?? "10",
        rest_sec: exercise.rest_sec ?? 60,
        kind: exercise.kind ?? "bodyweight",
        coach_note: exercise.coach_note ?? "",
      })),
      index: workout.exercises.findIndex((exercise) => exercise.id === id),
    });

    await replaceExercise(id, exercise);
    await setSummary(workout.id, summary);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Swap failed" },
      { status: 500 },
    );
  }
}
