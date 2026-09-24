import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { formatDay } from "@/lib/date";
import { listWorkouts } from "@/lib/workouts";
import { FOCUS_LABELS, LOCATION_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const workouts = await listWorkouts();
  const completed = workouts.filter((w) => w.status === "completed").length;

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader />
      <h1 className="text-3xl font-bold text-bunny-700">Your workouts</h1>
      <p className="mb-5 mt-1 text-sm text-ink-soft">
        {completed} finished out of {workouts.length}
      </p>

      {workouts.length === 0 ? (
        <div className="card text-center text-ink-soft">
          Nothing here yet. Make your first workout 🐰
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {workouts.map((workout) => (
            <li key={workout.id}>
              <Link href={`/workout/${workout.id}`} className="card block">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold text-bunny-700">{workout.title}</h2>
                  <span className="text-xl">
                    {workout.status === "completed" ? "🎀" : "⏳"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {formatDay(workout.workout_date)}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-bunny-500">
                  {LOCATION_LABELS[workout.location]} · {workout.duration_min} min
                  · {FOCUS_LABELS[workout.focus]}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
