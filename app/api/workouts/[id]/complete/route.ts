import { z } from "zod";
import type { NextRequest } from "next/server";
import { guardApi } from "@/lib/guard";
import { todayISO } from "@/lib/date";
import { rewardsFor } from "@/lib/progress";
import { completeWorkout, progressRows } from "@/lib/workouts";

const Body = z.object({ everything: z.boolean().optional() });

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/workouts/[id]/complete">,
) {
  const denied = await guardApi();
  if (denied) return denied;

  const { id } = await context.params;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const phrase = await completeWorkout(id, parsed.data.everything);
    const rewards = rewardsFor(await progressRows(), id, todayISO());
    return Response.json({ phrase, rewards });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not finish" },
      { status: 500 },
    );
  }
}
