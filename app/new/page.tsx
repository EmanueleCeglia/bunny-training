import AppHeader from "@/components/AppHeader";
import NewWorkoutForm from "@/components/NewWorkoutForm";
import { suggestNext } from "@/lib/program";
import { sessionHistory } from "@/lib/workouts";

export const dynamic = "force-dynamic";

export default async function NewWorkoutPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AppHeader />
      <h1 className="mb-5 text-3xl font-bold text-bunny-700">
        A fresh workout
      </h1>
      <NewWorkoutForm suggested={suggestNext(await sessionHistory())} />
    </main>
  );
}
