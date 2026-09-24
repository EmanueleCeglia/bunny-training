import { notFound } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import WorkoutView from "@/components/WorkoutView";
import { formatDay } from "@/lib/date";
import { getMessages, getUnlockedPhrase, getWorkout } from "@/lib/workouts";

export const dynamic = "force-dynamic";

export default async function WorkoutPage({
  params,
}: PageProps<"/workout/[id]">) {
  const { id } = await params;
  const workout = await getWorkout(id);
  if (!workout) notFound();

  const [messages, unlockedPhrase] = await Promise.all([
    getMessages(id),
    getUnlockedPhrase(id),
  ]);

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader />
      <p className="mb-3 text-sm text-ink-soft">
        {formatDay(workout.workout_date)}
      </p>
      <WorkoutView
        workout={workout}
        messages={messages}
        unlockedPhrase={unlockedPhrase}
      />
    </main>
  );
}
