"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import MysteryBox from "./MysteryBox";
import {
  DIFFICULTY_LABELS,
  FOCUS_LABELS,
  LOCATION_LABELS,
  type Message,
  type WorkoutWithExercises,
} from "@/lib/types";

export default function WorkoutView({
  workout,
  messages,
  unlockedPhrase,
}: {
  workout: WorkoutWithExercises;
  messages: Message[];
  unlockedPhrase: string | null;
}) {
  const router = useRouter();
  const [doneIds, setDoneIds] = useState(
    () => new Set(workout.exercises.filter((e) => e.done).map((e) => e.id)),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [boxPhrase, setBoxPhrase] = useState<string | null>(null);

  const allDone = doneIds.size === workout.exercises.length;
  const finished = workout.status === "completed";

  async function toggle(id: string) {
    if (finished) return;
    const next = new Set(doneIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDoneIds(next);

    await fetch(`/api/exercises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next.has(id) }),
    });
  }

  async function swap(exerciseId: string) {
    setBusy(`swap-${exerciseId}`);
    setError(null);
    try {
      const response = await fetch(`/api/exercises/${exerciseId}/swap`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not swap it");
      setDoneIds((current) => {
        const next = new Set(current);
        next.delete(exerciseId);
        return next;
      });
      router.refresh();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not swap it");
    } finally {
      setBusy(null);
    }
  }

  async function revise(body: Record<string, unknown>, label: string) {
    setBusy(label);
    setError(null);
    try {
      const response = await fetch(`/api/workouts/${workout.id}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not change it");
      setDoneIds(new Set());
      setDraft("");
      router.refresh();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not change it");
    } finally {
      setBusy(null);
    }
  }

  async function finish() {
    setBusy("finish");
    setError(null);
    try {
      const response = await fetch(`/api/workouts/${workout.id}/complete`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not finish");
      setBoxPhrase(data.phrase);
      router.refresh();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not finish");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card">
        <h1 className="text-2xl font-bold text-bunny-700">{workout.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{workout.summary}</p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-bunny-500">
          {LOCATION_LABELS[workout.location]} · {workout.duration_min} min ·{" "}
          {FOCUS_LABELS[workout.focus]}
        </p>

        {finished ? (
          <p className="mt-3 text-sm font-semibold text-bunny-600">
            Finished at {DIFFICULTY_LABELS[workout.difficulty].toLowerCase()}
          </p>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-bunny-50 p-2">
            <button
              className="btn-soft"
              disabled={busy !== null || workout.difficulty <= 1}
              onClick={() => revise({ difficultyDelta: -1 }, "easier")}
            >
              − Easier
            </button>
            <span className="text-sm font-bold text-bunny-700">
              {busy === "easier" || busy === "harder"
                ? "Adjusting…"
                : DIFFICULTY_LABELS[workout.difficulty]}
            </span>
            <button
              className="btn-soft"
              disabled={busy !== null || workout.difficulty >= 5}
              onClick={() => revise({ difficultyDelta: 1 }, "harder")}
            >
              Harder +
            </button>
          </div>
        )}
      </section>

      {error && (
        <p className="text-center text-sm font-semibold text-bunny-600">{error}</p>
      )}

      <ol className="flex flex-col gap-3">
        {workout.exercises.map((exercise, index) => {
          const checked = doneIds.has(exercise.id);
          const swapping = busy === `swap-${exercise.id}`;
          return (
            <li
              key={exercise.id}
              className={`card flex gap-2 transition ${checked ? "opacity-60" : ""}`}
            >
              <button
                type="button"
                onClick={() => toggle(exercise.id)}
                className="flex flex-1 gap-3 text-left"
              >
                <span
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    checked
                      ? "border-bunny-400 bg-bunny-400 text-white"
                      : "border-bunny-200 text-bunny-400"
                  }`}
                >
                  {checked ? "✓" : index + 1}
                </span>
                <span className="flex-1">
                  <span
                    className={`block font-bold text-ink ${checked ? "line-through" : ""}`}
                  >
                    {swapping ? "Finding another one…" : exercise.name}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold text-bunny-600">
                    {exercise.sets} × {exercise.reps}
                    {exercise.rest_sec ? ` · ${exercise.rest_sec}s rest` : ""}
                  </span>
                  {exercise.coach_note && (
                    <span className="mt-1 block text-sm text-ink-soft">
                      {exercise.coach_note}
                    </span>
                  )}
                </span>
              </button>

              {!finished && (
                <button
                  type="button"
                  onClick={() => swap(exercise.id)}
                  disabled={busy !== null}
                  aria-label={`Swap ${exercise.name} for something else`}
                  className={`size-9 shrink-0 self-start rounded-full border border-bunny-200 text-base transition active:scale-90 disabled:opacity-40 ${
                    swapping ? "animate-wiggle" : ""
                  }`}
                >
                  🔄
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {finished ? (
        unlockedPhrase && (
          <section className="card text-center">
            <div className="text-4xl">💝</div>
            <p className="mt-2 font-bold text-bunny-700">{unlockedPhrase}</p>
          </section>
        )
      ) : (
        <div className="flex flex-col items-center gap-2">
          <button
            className="btn-primary"
            onClick={finish}
            disabled={busy !== null || doneIds.size === 0}
          >
            {busy === "finish" ? "Wrapping your gift…" : "Finish workout 🎁"}
          </button>
          <p className="text-xs text-ink-soft">
            {doneIds.size === 0
              ? "Tick each exercise as you go"
              : allDone
                ? `All ${workout.exercises.length} done — go get your box`
                : `${doneIds.size} of ${workout.exercises.length} done — finish whenever you like`}
          </p>
        </div>
      )}

      {(!finished || messages.length > 0) && (
      <section className="card flex flex-col gap-3">
        <h2 className="font-bold text-bunny-700">
          {finished ? "What you changed" : "Ask for a change"}
        </h2>

        {messages.length > 0 && (
          <div className="flex flex-col gap-2">
            {messages.map((message) => (
              <p
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "self-end bg-bunny-500 text-white"
                    : "self-start bg-bunny-100 text-ink"
                }`}
              >
                {message.content}
              </p>
            ))}
          </div>
        )}

        {!finished && (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim() && !busy) {
              void revise({ instruction: draft.trim() }, "chat");
            }
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            enterKeyHint="send"
            placeholder="Less machines, more free weights…"
            className="min-w-0 flex-1 rounded-full border border-bunny-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-bunny-300 focus:border-bunny-400"
          />
          <button
            type="submit"
            className="btn-soft"
            disabled={busy !== null || !draft.trim()}
          >
            {busy === "chat" ? "…" : "Send"}
          </button>
        </form>
        )}
      </section>
      )}

      {boxPhrase && (
        <MysteryBox phrase={boxPhrase} onClose={() => setBoxPhrase(null)} />
      )}
    </div>
  );
}
