import type { NextRequest } from "next/server";
import { guardApi } from "@/lib/guard";
import { completeWorkout } from "@/lib/workouts";

export async function POST(
  _request: NextRequest,
  context: RouteContext<"/api/workouts/[id]/complete">,
) {
  const denied = await guardApi();
  if (denied) return denied;

  const { id } = await context.params;
  try {
    const phrase = await completeWorkout(id);
    return Response.json({ phrase });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not finish" },
      { status: 500 },
    );
  }
}
