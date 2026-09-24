import type { NextRequest } from "next/server";
import { guardApi } from "@/lib/guard";
import { deleteWorkout } from "@/lib/workouts";

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
