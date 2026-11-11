import { z } from "zod";
import { guardApi } from "@/lib/guard";
import { generateWorkout } from "@/lib/ai";
import { todayISO } from "@/lib/date";
import { suggestNext } from "@/lib/program";
import { createWorkout, sessionHistory } from "@/lib/workouts";

export const maxDuration = 60;

const Body = z.object({
  location: z.enum(["gym", "home"]),
  durationMin: z.number().int().min(10).max(180),
  focus: z.enum(["full_body", "upper", "lower"]),
});

export async function POST(request: Request) {
  const denied = await guardApi();
  if (denied) return denied;

  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid workout request" }, { status: 400 });
  }

  try {
    const history = await sessionHistory();
    // She never picks a difficulty: it follows how her last session went.
    const session = { ...parsed.data, difficulty: suggestNext(history).difficulty };
    const plan = await generateWorkout({
      ...session,
      history,
      dateISO: todayISO(),
    });
    const id = await createWorkout(session, plan);
    return Response.json({ id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 },
    );
  }
}
