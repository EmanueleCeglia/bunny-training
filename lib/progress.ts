import { APP_TIMEZONE } from "./date";
import type { Focus, TrainingLocation } from "./types";

/**
 * Carrots, levels, streaks and badges. Nothing here is stored: it is all worked
 * out from the workouts she has finished, so it can never drift out of step
 * with her history and needs no tables of its own.
 */

export const WEEKLY_GOAL = 3;

const CARROTS_PER_WORKOUT = 10;
const CARROTS_PER_EXERCISE = 1;
const CARROTS_FOR_EVERYTHING = 5;
const CARROTS_FOR_FULL_BASKET = 15;

const LEVELS = [
  { name: "Baby Bunny", floor: 0 },
  { name: "Little Hopper", floor: 40 },
  { name: "Garden Explorer", floor: 100 },
  { name: "Carrot Chaser", floor: 200 },
  { name: "Meadow Sprinter", floor: 350 },
  { name: "Burrow Boss", floor: 550 },
  { name: "Carrot Queen", floor: 800 },
  { name: "Bunny Legend", floor: 1100 },
];

export type ProgressRow = {
  id: string;
  workout_date: string;
  completed_at: string | null;
  status: "planned" | "completed";
  location: TrainingLocation;
  focus: Focus;
  duration_min: number;
  exercises: { done: boolean }[];
};

export type Level = {
  number: number;
  name: string;
  floor: number;
  /** Carrots needed for the next level, or null at the top. */
  next: number | null;
  nextName: string | null;
};

export type Badge = {
  id: string;
  emoji: string;
  name: string;
  how: string;
  earned: boolean;
};

export type Progress = {
  carrots: number;
  level: Level;
  /** Workouts finished in the current Monday-to-Sunday week. */
  thisWeek: number;
  streakWeeks: number;
  workouts: number;
  minutes: number;
  badges: Badge[];
};

export type Rewards = {
  /** Carrots this workout earned, and her total afterwards. */
  carrots: number;
  total: number;
  level: Level;
  levelUp: boolean;
  fullBasket: boolean;
  badges: Badge[];
};

function mondayOf(dateISO: string): string {
  const date = new Date(`${dateISO}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function weekBefore(mondayISO: string): string {
  const date = new Date(`${mondayISO}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 7);
  return date.toISOString().slice(0, 10);
}

function daysBetween(earlierISO: string, laterISO: string): number {
  return Math.round(
    (Date.parse(`${laterISO}T12:00:00Z`) - Date.parse(`${earlierISO}T12:00:00Z`)) /
      86_400_000,
  );
}

function hourOf(timestamp: string): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: APP_TIMEZONE,
    }).format(new Date(timestamp)),
  );
}

function levelFor(carrots: number): Level {
  const index = LEVELS.findLastIndex((level) => carrots >= level.floor);
  const next = LEVELS[index + 1];
  return {
    number: index + 1,
    name: LEVELS[index].name,
    floor: LEVELS[index].floor,
    next: next?.floor ?? null,
    nextName: next?.name ?? null,
  };
}

function everythingTicked(row: ProgressRow): boolean {
  return row.exercises.length > 0 && row.exercises.every((e) => e.done);
}

function carrotsFor(row: ProgressRow): number {
  return (
    CARROTS_PER_WORKOUT +
    row.exercises.filter((e) => e.done).length * CARROTS_PER_EXERCISE +
    (everythingTicked(row) ? CARROTS_FOR_EVERYTHING : 0)
  );
}

function longestRun(mondays: string[]): number {
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const monday of [...mondays].sort()) {
    run = previous && weekBefore(monday) === previous ? run + 1 : 1;
    best = Math.max(best, run);
    previous = monday;
  }
  return best;
}

export function computeProgress(rows: ProgressRow[], todayISO: string): Progress {
  const finished = rows
    .filter((row) => row.status === "completed")
    .sort((a, b) => a.workout_date.localeCompare(b.workout_date));

  const weeks = new Map<string, ProgressRow[]>();
  for (const row of finished) {
    const monday = mondayOf(row.workout_date);
    weeks.set(monday, [...(weeks.get(monday) ?? []), row]);
  }
  const fullBaskets = [...weeks.values()].filter(
    (week) => week.length >= WEEKLY_GOAL,
  ).length;

  const carrots =
    finished.reduce((total, row) => total + carrotsFor(row), 0) +
    fullBaskets * CARROTS_FOR_FULL_BASKET;

  // A week only breaks the streak once it has ended without a workout.
  const thisMonday = mondayOf(todayISO);
  let streakWeeks = 0;
  let monday = weeks.has(thisMonday) ? thisMonday : weekBefore(thisMonday);
  while (weeks.has(monday)) {
    streakWeeks++;
    monday = weekBefore(monday);
  }

  const count = (test: (row: ProgressRow) => boolean) =>
    finished.filter(test).length;
  const bestRun = longestRun([...weeks.keys()]);
  const cameBack = finished.some(
    (row, index) =>
      index > 0 &&
      daysBetween(finished[index - 1].workout_date, row.workout_date) >= 10,
  );
  const allRound = [...weeks.values()].some(
    (week) => new Set(week.map((row) => row.focus)).size === 3,
  );

  const badge = (
    id: string,
    emoji: string,
    name: string,
    how: string,
    earned: boolean,
  ): Badge => ({ id, emoji, name, how, earned });

  return {
    carrots,
    level: levelFor(carrots),
    thisWeek: weeks.get(thisMonday)?.length ?? 0,
    streakWeeks,
    workouts: finished.length,
    minutes: finished.reduce((total, row) => total + row.duration_min, 0),
    badges: [
      badge("first", "🐣", "First Hop", "Finish your first workout", finished.length >= 1),
      badge("five", "🖐️", "High Five", "Finish 5 workouts", finished.length >= 5),
      badge("ten", "🔟", "Double Digits", "Finish 10 workouts", finished.length >= 10),
      badge("twentyfive", "🥈", "Twenty-Five Club", "Finish 25 workouts", finished.length >= 25),
      badge("fifty", "🏆", "Fifty Hops", "Finish 50 workouts", finished.length >= 50),
      badge("basket", "🧺", "Full Basket", "Train 3 times in one week", fullBaskets >= 1),
      badge("roll", "🔥", "On a Roll", "Train 3 weeks in a row", bestRun >= 3),
      badge("unstoppable", "⚡", "Unstoppable", "Train 8 weeks in a row", bestRun >= 8),
      badge("sweep", "💯", "Clean Sweep", "Tick every exercise in 5 workouts", count(everythingTicked) >= 5),
      badge("allround", "🎯", "All-Rounder", "Upper, lower and full body in one week", allRound),
      badge("gym", "🏋️", "Gym Bunny", "Finish 5 gym workouts", count((row) => row.location === "gym") >= 5),
      badge("home", "🏠", "Home Hero", "Finish 5 home workouts", count((row) => row.location === "home") >= 5),
      badge("hour", "⏱️", "Long Haul", "Finish a 60-minute workout", count((row) => row.duration_min >= 60) >= 1),
      badge("early", "🌅", "Early Bunny", "Finish before 9 in the morning", count((row) => !!row.completed_at && hourOf(row.completed_at) < 9) >= 1),
      badge("night", "🌙", "Night Owl", "Finish after 9 at night", count((row) => !!row.completed_at && hourOf(row.completed_at) >= 21) >= 1),
      badge("comeback", "💪", "Welcome Back", "Return after 10 days away", cameBack),
    ],
  };
}

/** What finishing one particular workout earned her. */
export function rewardsFor(
  rows: ProgressRow[],
  workoutId: string,
  todayISO: string,
): Rewards {
  const after = computeProgress(rows, todayISO);
  const before = computeProgress(
    rows.filter((row) => row.id !== workoutId),
    todayISO,
  );
  const had = new Set(before.badges.filter((b) => b.earned).map((b) => b.id));
  const badges = after.badges.filter((b) => b.earned && !had.has(b.id));

  return {
    carrots: after.carrots - before.carrots,
    total: after.carrots,
    level: after.level,
    levelUp: after.level.number > before.level.number,
    fullBasket:
      after.thisWeek === WEEKLY_GOAL && before.thisWeek === WEEKLY_GOAL - 1,
    badges,
  };
}
