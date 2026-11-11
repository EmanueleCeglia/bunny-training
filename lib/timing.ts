const SECONDS_PER_REP = 3;
const SECONDS_BETWEEN_EXERCISES = 45;
const FALLBACK_SET_SECONDS = 40;

export type Timed = {
  sets: number | null;
  reps: string | null;
  rest_sec: number | null;
};

export type Effort = {
  /** Seconds for one side when the move is timed, otherwise null. */
  holdSeconds: number | null;
  sides: 1 | 2;
  /** Seconds one whole set takes, both sides included. */
  setSeconds: number;
};

/** Reads free text like "10-12", "8 per leg" or "30 seconds per side". */
export function readEffort(reps: string | null): Effort {
  const text = (reps ?? "").toLowerCase();
  const sides = /\b(per|each)\s+(leg|side|arm)\b/.test(text) ? 2 : 1;

  const time = text.match(/(\d+(?:\.\d+)?)\s*(seconds?|secs?|s\b|minutes?|mins?)/);
  if (time) {
    const holdSeconds = Number(time[1]) * (time[2].startsWith("m") ? 60 : 1);
    return { holdSeconds, sides, setSeconds: holdSeconds * sides };
  }

  const counts = text.match(/\d+/g)?.map(Number) ?? [];
  const setSeconds = counts.length
    ? Math.max(...counts) * SECONDS_PER_REP * sides
    : FALLBACK_SET_SECONDS;
  return { holdSeconds: null, sides, setSeconds };
}

export function exerciseSeconds(exercise: Timed): number {
  const sets = Math.max(1, exercise.sets ?? 1);
  return (
    sets * readEffort(exercise.reps).setSeconds +
    (sets - 1) * (exercise.rest_sec ?? 0) +
    SECONDS_BETWEEN_EXERCISES
  );
}

/** A realistic length for the whole session, set-up and walking between stations included. */
export function estimateMinutes(exercises: Timed[]): number {
  const seconds = exercises.reduce(
    (total, exercise) => total + exerciseSeconds(exercise),
    0,
  );
  return seconds / 60;
}
