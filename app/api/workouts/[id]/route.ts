import { z } from "zod";
import type { NextRequest } from "next/server";
import { guardApi } from "@/lib/guard";
import { deleteWorkout, setFeel } from "@/lib/workouts";

const Body = z.object({ feel: z.enum(["easy", "right", "hard"]) });

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/workouts/[id]">,
) {
  const denied = await guardApi();
  if (denied) return denied;

  const { id } = await context.params;
  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  await setFeel(id, parsed.data.feel);
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/workouts/[id]">,
) {
  const denied = await guardApi();
  if (denied) return denied;

  const { id } = await context.params;
  await deleteWorkout(id);
  return Response.json({ ok: true });
}
