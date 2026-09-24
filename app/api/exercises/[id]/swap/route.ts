import type { NextRequest } from "next/server";
import { guardApi } from "@/lib/guard";
import { swapExercise } from "@/lib/ai";
import { getExerciseContext, replaceExercise } from "@/lib/workouts";

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

  const { exercise, workout } = found;

  try {
    const replacement = await swapExercise({
      location: workout.location,
      focus: workout.focus,
      difficulty: workout.difficulty,
      replacing: {
        name: exercise.name,
        sets: exercise.sets ?? 3,
        reps: exercise.reps ?? "10",
        rest_sec: exercise.rest_sec ?? 60,
        kind: exercise.kind ?? "bodyweight",
        coach_note: exercise.coach_note ?? "",
      },
      keeping: workout.exercises
        .filter((other) => other.id !== id)
        .map((other) => other.name),
    });

    await replaceExercise(id, replacement);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Swap failed" },
      { status: 500 },
    );
  }
}
