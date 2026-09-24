import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import NewWorkoutForm from "@/components/NewWorkoutForm";
import { formatDay, todayISO } from "@/lib/date";
import { getTodayWorkout } from "@/lib/workouts";
import { FOCUS_LABELS, LOCATION_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = await getTodayWorkout();
  const done = today?.exercises.filter((exercise) => exercise.done).length ?? 0;

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader />

      <p className="mb-1 text-sm text-ink-soft">{formatDay(todayISO())}</p>
      <h1 className="mb-5 text-3xl font-bold text-bunny-700">
        {today ? "Ready when you are" : "What are we doing today?"}
      </h1>

      {today ? (
        <div className="flex flex-col gap-3">
          <Link href={`/workout/${today.id}`} className="card block">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-bunny-700">{today.title}</h2>
              {today.status === "completed" && <span className="text-2xl">🎀</span>}
            </div>
            <p className="mt-1 text-sm text-ink-soft">{today.summary}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-bunny-500">
              {LOCATION_LABELS[today.location]} · {today.duration_min} min ·{" "}
              {FOCUS_LABELS[today.focus]}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-bunny-100">
              <div
                className="h-full rounded-full bg-bunny-400 transition-all"
                style={{
                  width: `${today.exercises.length ? (done / today.exercises.length) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              {done} of {today.exercises.length} exercises done
            </p>
          </Link>

          <Link href="/new" className="btn-soft self-center">
            Start a different one
          </Link>
        </div>
      ) : (
        <NewWorkoutForm />
      )}
    </main>
  );
}
