import { z } from "zod";
import type { NextRequest } from "next/server";
import { guardApi } from "@/lib/guard";
import { setExerciseDone } from "@/lib/workouts";

const Body = z.object({ done: z.boolean() });

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/exercises/[id]">,
) {
  const denied = await guardApi();
  if (denied) return denied;

  const { id } = await context.params;
  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  await setExerciseDone(id, parsed.data.done);
  return Response.json({ ok: true });
}
