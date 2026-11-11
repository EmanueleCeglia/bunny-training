"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import CoachSpinner from "./CoachSpinner";
import FeelPicker from "./FeelPicker";
import MoveDemo from "./MoveDemo";
import MysteryBox from "./MysteryBox";
import type { Rewards } from "@/lib/progress";
import { readEffort } from "@/lib/timing";
import {
  DIFFICULTY_LABELS,
  FOCUS_LABELS,
  LOCATION_LABELS,
  type Exercise,
  type Message,
  type WorkoutWithExercises,
} from "@/lib/types";

type Timer = {
  exerciseId: string;
  kind: "rest" | "hold";
  title: string;
  detail: string;
  endsAt: number;
  total: number;
  /** For a hold done on both sides: the seconds left at which she changes over. */
  switchAt: number | null;
};

const clock = (seconds: number) =>
  seconds >= 60
    ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
    : `${seconds}s`;

export default function WorkoutView({
  workout,
  messages,
  unlockedPhrase,
  lastTimes,
}: {
  workout: WorkoutWithExercises;
  messages: Message[];
  unlockedPhrase: string | null;
  /** Exercise name → what she did last time, for her main lifts. */
  lastTimes: Record<string, string>;
}) {
  const router = useRouter();
  const [doneIds, setDoneIds] = useState(
    () => new Set(workout.exercises.filter((e) => e.done).map((e) => e.id)),
  );
  const [setsDone, setSetsDone] = useState<Record<string, number>>({});
  const [timer, setTimer] = useState<Timer | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [askEverything, setAskEverything] = useState(false);
  const [box, setBox] = useState<{ phrase: string; rewards: Rewards } | null>(
    null,
  );
  const audio = useRef<AudioContext | null>(null);

  const finished = workout.status === "completed";

  // Keep the screen awake between sets; the browser drops the lock whenever
  // the page is hidden, so it is taken again each time she comes back.
  useEffect(() => {
    if (finished || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let stopped = false;
    const acquire = () =>
      navigator.wakeLock
        .request("screen")
        .then((sentinel) => {
          if (stopped) void sentinel.release();
          else lock = sentinel;
        })
        .catch(() => {});
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [finished]);

  function signal() {
    navigator.vibrate?.([200, 100, 200]);
    const context = audio.current;
    if (!context) return;
    const tone = context.createOscillator();
    const volume = context.createGain();
    tone.frequency.value = 880;
    volume.gain.setValueAtTime(0.25, context.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
    tone.connect(volume).connect(context.destination);
    tone.start();
    tone.stop(context.currentTime + 0.5);
  }

  function startTimer(next: Omit<Timer, "endsAt">) {
    // Browsers only allow sound that begins from a tap, and this is one.
    audio.current ??= new AudioContext();
    void audio.current.resume();
    setRemaining(next.total);
    setTimer({ ...next, endsAt: Date.now() + next.total * 1000 });
  }

  async function setDone(id: string, done: boolean) {
    setDoneIds((current) => {
      const next = new Set(current);
      if (done) next.add(id);
      else next.delete(id);
      return next;
    });
    await fetch(`/api/exercises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
  }

  const forgetSets = (id: string) =>
    setSetsDone((current) =>
      Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)),
    );

  function completeSet(exercise: Exercise) {
    const total = exercise.sets ?? 1;
    const done = (setsDone[exercise.id] ?? 0) + 1;

    if (done >= total) {
      forgetSets(exercise.id);
      setTimer(null);
      void setDone(exercise.id, true);
      return;
    }

    setSetsDone({ ...setsDone, [exercise.id]: done });
    if (exercise.rest_sec) {
      startTimer({
        exerciseId: exercise.id,
        kind: "rest",
        title: "Rest",
        detail: `Then set ${done + 1} of ${total} · ${exercise.name}`,
        total: exercise.rest_sec,
        switchAt: null,
      });
    } else {
      setTimer(null);
    }
  }

  function tapSet(exercise: Exercise) {
    const effort = readEffort(exercise.reps);
    if (effort.holdSeconds === null) {
      completeSet(exercise);
      return;
    }
    startTimer({
      exerciseId: exercise.id,
      kind: "hold",
      title: exercise.name,
      detail: `Set ${(setsDone[exercise.id] ?? 0) + 1} of ${exercise.sets ?? 1}`,
      total: effort.setSeconds,
      switchAt: effort.sides === 2 ? effort.holdSeconds : null,
    });
  }

  const onTimerEnd = useEffectEvent((ended: Timer) => {
    signal();
    const exercise = workout.exercises.find((e) => e.id === ended.exerciseId);
    if (ended.kind === "hold" && exercise) completeSet(exercise);
    else setTimer(null);
  });
  const onSwitchSides = useEffectEvent(signal);

  useEffect(() => {
    if (!timer) return;
    let shown = -1;
    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
      if (left === shown) return;
      shown = left;
      setRemaining(left);
      if (left === 0) {
        clearInterval(tick);
        onTimerEnd(timer);
      } else if (left === timer.switchAt) {
        onSwitchSides();
      }
    }, 250);
    return () => clearInterval(tick);
  }, [timer]);

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
      forgetSets(exerciseId);
      if (timer?.exerciseId === exerciseId) setTimer(null);
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
      // The page remounts this view around the rewritten plan.
      router.refresh();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not change it");
    } finally {
      setBusy(null);
    }
  }

  async function finish(everything: boolean) {
    setBusy("finish");
    setError(null);
    try {
      const response = await fetch(`/api/workouts/${workout.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ everything }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not finish");
      if (everything) setDoneIds(new Set(workout.exercises.map((e) => e.id)));
      setTimer(null);
      setAskEverything(false);
      setBox(data);
      router.refresh();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not finish");
    } finally {
      setBusy(null);
    }
  }

  const switched =
    !!timer && timer.switchAt !== null && remaining <= timer.switchAt;

  return (
    <div className={`flex flex-col gap-4 ${finished ? "" : timer ? "pb-52" : "pb-28"}`}>
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
            <span className="flex items-center gap-2 text-sm font-bold text-bunny-700">
              {busy === "easier" || busy === "harder" ? (
                <>
                  <CoachSpinner size={20} />
                  Adjusting…
                </>
              ) : (
                DIFFICULTY_LABELS[workout.difficulty]
              )}
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
          const sets = exercise.sets ?? 1;
          const setsTicked = setsDone[exercise.id] ?? 0;
          const effort = readEffort(exercise.reps);
          const holding =
            timer?.kind === "hold" && timer.exerciseId === exercise.id;
          const lastTime = lastTimes[exercise.name];

          return (
            <li
              key={exercise.id}
              className={`card flex flex-col gap-3 transition ${checked ? "opacity-60" : ""}`}
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => !finished && setDone(exercise.id, !checked)}
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
                      {sets} × {exercise.reps}
                      {exercise.rest_sec ? ` · ${exercise.rest_sec}s rest` : ""}
                    </span>
                    {lastTime && !checked && (
                      <span className="mt-1 inline-block rounded-full bg-bunny-50 px-2.5 py-0.5 text-xs font-semibold text-bunny-500">
                        Last time {lastTime}
                      </span>
                    )}
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
                    className="flex size-9 shrink-0 items-center justify-center self-start rounded-full border border-bunny-200 text-base transition active:scale-90 disabled:opacity-40"
                  >
                    {swapping ? <CoachSpinner size={22} /> : "🔄"}
                  </button>
                )}
              </div>

              {!checked && !swapping && <MoveDemo name={exercise.name} />}

              {!checked &&
                !finished &&
                !swapping &&
                (sets > 1 || effort.holdSeconds !== null) && (
                  <div className="flex items-center gap-3">
                    {sets > 1 && (
                      <span
                        className="flex gap-1.5"
                        aria-label={`${setsTicked} of ${sets} sets done`}
                      >
                        {Array.from({ length: sets }, (_, set) => (
                          <span
                            key={set}
                            className={`size-3 rounded-full ${
                              set < setsTicked ? "bg-bunny-400" : "bg-bunny-100"
                            }`}
                          />
                        ))}
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn-soft flex-1"
                      disabled={holding}
                      onClick={() => tapSet(exercise)}
                    >
                      {holding
                        ? "Timer running…"
                        : effort.holdSeconds !== null
                          ? `▶ Start ${effort.sides === 2 ? "2 × " : ""}${clock(effort.holdSeconds)}${sets > 1 ? ` · set ${setsTicked + 1}` : ""}`
                          : `Set ${setsTicked + 1} of ${sets} done ✓`}
                    </button>
                  </div>
                )}
            </li>
          );
        })}
      </ol>

      {finished && unlockedPhrase && (
        <section className="card flex flex-col gap-4 text-center">
          <div>
            <div className="text-4xl">💝</div>
            <p className="mt-2 font-bold text-bunny-700">{unlockedPhrase}</p>
          </div>
          <FeelPicker workoutId={workout.id} initial={workout.feel ?? null} />
        </section>
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
                {busy === "chat" ? <CoachSpinner size={20} /> : "Send"}
              </button>
            </form>
          )}
        </section>
      )}

      {!finished && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto flex w-full max-w-md flex-col gap-2 bg-gradient-to-t from-bunny-50 from-70% to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 *:pointer-events-auto">
            {timer && (
              <div className="card relative flex items-center gap-3 overflow-hidden !p-3">
                <Image
                  src="/coach.webp"
                  alt=""
                  aria-hidden
                  width={44}
                  height={44}
                  unoptimized
                  className="animate-bob shrink-0"
                />
                <div className="min-w-0 flex-1" role="timer" aria-live="off">
                  <p className="truncate text-xs font-semibold text-ink-soft">
                    {timer.kind === "rest"
                      ? timer.detail
                      : `${switched ? "Other side" : timer.title} · ${timer.detail}`}
                  </p>
                  <p className="text-3xl font-bold tabular-nums leading-tight text-bunny-700">
                    {timer.kind === "rest" ? "Rest " : ""}
                    {clock(remaining)}
                  </p>
                </div>
                {timer.kind === "rest" && (
                  <button
                    className="btn-soft !px-3"
                    onClick={() =>
                      setTimer({
                        ...timer,
                        endsAt: timer.endsAt + 15_000,
                        total: timer.total + 15,
                      })
                    }
                  >
                    +15s
                  </button>
                )}
                <button className="btn-soft !px-3" onClick={() => setTimer(null)}>
                  {timer.kind === "rest" ? "Skip" : "Stop"}
                </button>
                <span
                  className="absolute inset-x-0 bottom-0 h-1 origin-left bg-bunny-400 transition-transform duration-300 ease-linear"
                  style={{ transform: `scaleX(${remaining / timer.total})` }}
                />
              </div>
            )}

            {askEverything ? (
              <div className="card flex flex-col gap-3 !p-4 text-center">
                <p className="font-bold text-bunny-700">
                  Did you do the whole workout?
                </p>
                <div className="flex gap-2">
                  <button
                    className="btn-soft flex-1"
                    disabled={busy !== null}
                    onClick={() => setAskEverything(false)}
                  >
                    Not yet
                  </button>
                  <button
                    className="btn-primary flex-[2] !py-3"
                    disabled={busy !== null}
                    onClick={() => finish(true)}
                  >
                    {busy === "finish" ? (
                      <CoachSpinner size={22} />
                    ) : (
                      "Yes, all of it 💪"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn-primary"
                disabled={busy !== null}
                onClick={() =>
                  doneIds.size === 0 ? setAskEverything(true) : finish(false)
                }
              >
                {busy === "finish" ? (
                  <>
                    <CoachSpinner size={22} />
                    Wrapping your gift…
                  </>
                ) : (
                  <>
                    Finish workout 🎁
                    <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">
                      {doneIds.size}/{workout.exercises.length}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {box && (
        <MysteryBox
          workoutId={workout.id}
          phrase={box.phrase}
          rewards={box.rewards}
          onClose={() => setBox(null)}
        />
      )}
    </div>
  );
}
