import { z } from "zod";
import { guardApi } from "@/lib/guard";
import { generateWorkout } from "@/lib/ai";
import {
  createWorkout,
  recentExercises,
  recentSummaries,
} from "@/lib/workouts";

export const maxDuration = 60;

const Body = z.object({
  location: z.enum(["gym", "home"]),
  durationMin: z.number().int().min(10).max(180),
  focus: z.enum(["full_body", "upper", "lower"]),
  difficulty: z.number().int().min(1).max(5),
});

export async function POST(request: Request) {
  const denied = await guardApi();
  if (denied) return denied;

  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid workout request" }, { status: 400 });
  }

  try {
    const [summaries, exercises] = await Promise.all([
      recentSummaries(),
      recentExercises(),
    ]);
    const plan = await generateWorkout({
      ...parsed.data,
      recentSummaries: summaries,
      recentExercises: exercises,
    });
    const id = await createWorkout(parsed.data, plan);
    return Response.json({ id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 },
    );
  }
}
