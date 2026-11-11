import { notFound } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import WorkoutView from "@/components/WorkoutView";
import { catalogByName } from "@/lib/catalog";
import { formatDay } from "@/lib/date";
import { lastDone } from "@/lib/program";
import {
  getMessages,
  getUnlockedPhrase,
  getWorkout,
  sessionHistory,
} from "@/lib/workouts";

export const dynamic = "force-dynamic";

export default async function WorkoutPage({
  params,
}: PageProps<"/workout/[id]">) {
  const { id } = await params;
  const workout = await getWorkout(id);
  if (!workout) notFound();

  const [messages, unlockedPhrase, history] = await Promise.all([
    getMessages(id),
    getUnlockedPhrase(id),
    sessionHistory(),
  ]);

  // Only the main lifts carry a "last time": those are the ones she is
  // meant to watch herself improve at.
  const earlier = history.filter((session) => session.id !== id);
  const lastTimes: Record<string, string> = {};
  for (const exercise of workout.exercises) {
    const before = catalogByName(exercise.name)?.staple
      ? lastDone(exercise.name, earlier)
      : null;
    if (before) lastTimes[exercise.name] = before;
  }

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader />
      <p className="mb-3 text-sm text-ink-soft">
        {formatDay(workout.workout_date)}
      </p>
      <WorkoutView
        // A chat revision rewrites every row; a new key starts the view afresh.
        key={workout.exercises.map((exercise) => exercise.id).join()}
        workout={workout}
        messages={messages}
        unlockedPhrase={unlockedPhrase}
        lastTimes={lastTimes}
      />
    </main>
  );
}
