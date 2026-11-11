import {
  CATALOG,
  catalogByName,
  type CatalogExercise,
  type Pattern,
} from "./catalog";
import { estimateMinutes, readEffort } from "./timing";
import type {
  Feel,
  Focus,
  PlannedExercise,
  TrainingLocation,
} from "./types";

/**
 * Everything about a session that can be decided without asking the model:
 * how many exercises fit the time, which main lifts she is on this month,
 * which moves are on offer for each remaining slot, and how long it all takes.
 *
 * The model follows rules it is merely told only loosely, so each rule here is
 * turned into the shape of the answer it is allowed to give.
 */

export type PastSession = {
  id: string;
  date: string;
  location: TrainingLocation;
  focus: Focus;
  durationMin: number;
  difficulty: number;
  completed: boolean;
  feel: Feel | null;
  title: string;
  exercises: {
    name: string;
    sets: number | null;
    reps: string | null;
    done: boolean;
  }[];
};

export type Role = "warmup" | "main" | "accessory" | "finisher" | "cooldown";

export type Slot = {
  key: string;
  role: Role;
  /** What the trainer is asked to put here. */
  ask: string;
  options: CatalogExercise[];
};

const MAX_OPTIONS = 5;
const BLOCK_WEEKS = 4;

const LOWER: Pattern[] = ["squat", "hinge", "glute"];
const POSTERIOR: Pattern[] = ["hinge", "glute"];

type Need = { label: string; patterns: Pattern[] };

/** What a session must contain to count as balanced for its focus. */
const NEEDS: Record<Focus, Need[]> = {
  lower: [
    { label: "a squat or lunge", patterns: ["squat"] },
    { label: "a hip hinge or glute move", patterns: POSTERIOR },
  ],
  upper: [
    { label: "a push", patterns: ["push"] },
    { label: "a pull", patterns: ["pull"] },
  ],
  full_body: [
    { label: "a leg or glute move", patterns: LOWER },
    { label: "a push", patterns: ["push"] },
    { label: "a pull", patterns: ["pull"] },
  ],
};

type Shape = Record<Role, number>;

function shapeFor(durationMin: number, focus: Focus): Shape {
  if (durationMin <= 20) {
    return { warmup: 1, main: 2, accessory: 1, finisher: 1, cooldown: 1 };
  }
  if (durationMin <= 30) {
    return { warmup: 1, main: 2, accessory: 2, finisher: 1, cooldown: 1 };
  }
  if (durationMin <= 45) {
    return { warmup: 2, main: 3, accessory: 2, finisher: 1, cooldown: 2 };
  }
  return focus === "full_body"
    ? { warmup: 2, main: 4, accessory: 3, finisher: 2, cooldown: 2 }
    : { warmup: 2, main: 3, accessory: 4, finisher: 2, cooldown: 2 };
}

/** A fresh order every time, so the model is not nudged towards whatever is listed first. */
export function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Splits a pool into menus that share no exercise, so two slots can never pick the same move. */
function deal(pool: CatalogExercise[], count: number): CatalogExercise[][] {
  const menus: CatalogExercise[][] = Array.from({ length: count }, () => []);
  shuffled(pool).forEach((exercise, index) => {
    const menu = menus[index % count];
    if (menu.length < MAX_OPTIONS) menu.push(exercise);
  });
  return menus;
}

/**
 * Main lifts stay put for four weeks at a time, so she repeats them often
 * enough to feel herself improve, then move on to keep things fresh.
 */
function blockIndex(dateISO: string): number {
  const days = Math.floor(Date.parse(`${dateISO}T00:00:00Z`) / 86_400_000);
  const mondayWeek = Math.floor((days + 3) / 7);
  return Math.floor(mondayWeek / BLOCK_WEEKS);
}

/** Once the essentials are covered, what a further main lift should be. */
function extraLift(focus: Focus, first: CatalogExercise | undefined): Pattern[] {
  if (focus === "upper") return ["push", "pull"];
  if (focus === "lower") return LOWER;
  return first?.pattern === "squat" ? POSTERIOR : ["squat"];
}

function mainLifts(
  location: TrainingLocation,
  focus: Focus,
  count: number,
  dateISO: string,
): CatalogExercise[] {
  const staples = CATALOG.filter(
    (exercise) => exercise.staple && exercise.places.includes(location),
  );
  const block = blockIndex(dateISO);
  const chosen: CatalogExercise[] = [];

  for (let slot = 0; slot < count; slot++) {
    const patterns =
      NEEDS[focus][slot]?.patterns ?? extraLift(focus, chosen[0]);
    const candidates = staples.filter(
      (exercise) =>
        exercise.pattern &&
        patterns.includes(exercise.pattern) &&
        !chosen.includes(exercise),
    );
    if (candidates.length) {
      chosen.push(candidates[(block + slot) % candidates.length]);
    }
  }
  return chosen;
}

function namesOf(session: PastSession | undefined): Set<string> {
  return new Set(
    (session?.exercises ?? []).map((exercise) => exercise.name.toLowerCase()),
  );
}

/** Drops what she did in her last session, and the one before when the pool can spare it. */
function fresh(
  pool: CatalogExercise[],
  needed: number,
  history: PastSession[],
): CatalogExercise[] {
  const last = namesOf(history[0]);
  const before = namesOf(history[1]);
  const notLast = pool.filter((e) => !last.has(e.name.toLowerCase()));
  const notRecent = notLast.filter((e) => !before.has(e.name.toLowerCase()));
  if (notRecent.length >= needed * 3) return notRecent;
  if (notLast.length >= needed * 2) return notLast;
  return pool;
}

/** Easy days stay on beginner moves; the hardest days leave them out. */
function levelled(
  pool: CatalogExercise[],
  needed: number,
  difficulty: number,
): CatalogExercise[] {
  const max = difficulty <= 1 ? 1 : difficulty <= 3 ? 2 : 3;
  const min = difficulty >= 5 ? 2 : 1;
  const fitting = pool.filter((e) => e.level >= min && e.level <= max);
  return fitting.length >= needed * 2 ? fitting : pool;
}

/** The last time she ticked this exercise off, as "3 × 10-12 on 5 Nov". */
export function lastDone(
  name: string,
  history: PastSession[],
): string | null {
  for (const session of history) {
    const found = session.exercises.find(
      (exercise) =>
        exercise.done && exercise.name.toLowerCase() === name.toLowerCase(),
    );
    if (found?.sets && found.reps) {
      const day = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(new Date(`${session.date}T12:00:00Z`));
      return `${found.sets} × ${found.reps} on ${day}`;
    }
  }
  return null;
}

export type SessionRequest = {
  location: TrainingLocation;
  focus: Focus;
  durationMin: number;
  difficulty: number;
  /** Newest first. */
  history: PastSession[];
  dateISO: string;
};

/** The exact list of choices the trainer has to make for this session, in workout order. */
export function buildSlots(request: SessionRequest): Slot[] {
  const { location, focus, durationMin, difficulty, history } = request;
  const shape = shapeFor(durationMin, focus);
  const here = CATALOG.filter((exercise) => exercise.places.includes(location));
  const slots: Slot[] = [];
  const add = (role: Role, ask: string, options: CatalogExercise[]) => {
    if (options.length === 0) return;
    const index = slots.filter((slot) => slot.role === role).length + 1;
    slots.push({ key: `${role}_${index}`, role, ask, options });
  };

  // Warm-up
  const easyCardio = here.filter(
    (e) => e.kind === "cardio" && e.level === 1,
  );
  const mobility = here.filter(
    (e) => e.region === "warmup" && e.kind !== "cardio",
  );
  if (shape.warmup === 1) {
    const [menu] = deal(fresh([...easyCardio, ...mobility], 1, history), 1);
    add("warmup", "one warm-up that suits today's muscles", menu);
  } else {
    add(
      "warmup",
      "easy cardio to get warm",
      deal(fresh(easyCardio, 1, history), 1)[0],
    );
    add(
      "warmup",
      "a mobility move for the joints she is about to use",
      deal(fresh(mobility, 1, history), 1)[0],
    );
  }

  // Main lifts
  const mains = mainLifts(location, focus, shape.main, request.dateISO);
  for (const lift of mains) {
    const before = lastDone(lift.name, history);
    add(
      "main",
      before
        ? `main lift, already chosen. Last time she did ${before}`
        : "main lift, already chosen. First time she logs this one",
      [lift],
    );
  }

  // Accessories
  const strength = here.filter(
    (e) =>
      (e.region === "upper" && focus !== "lower") ||
      (e.region === "lower" && focus !== "upper"),
  );
  let pool = fresh(
    levelled(
      strength.filter((e) => !mains.includes(e)),
      shape.accessory,
      difficulty,
    ),
    shape.accessory,
    history,
  );
  const take = (menu: CatalogExercise[]) => {
    pool = pool.filter((exercise) => !menu.includes(exercise));
    return menu;
  };

  const missing = NEEDS[focus].filter(
    (need) =>
      !mains.some((lift) => lift.pattern && need.patterns.includes(lift.pattern)),
  );
  let open = shape.accessory;
  for (const need of missing.slice(0, open)) {
    const menu = shuffled(
      pool.filter((e) => e.pattern && need.patterns.includes(e.pattern)),
    ).slice(0, MAX_OPTIONS);
    if (menu.length === 0) continue;
    add("accessory", `${need.label}, which the main lifts leave out`, take(menu));
    open--;
  }

  if (focus === "full_body") {
    const picked = slots
      .filter((slot) => slot.role === "main" || slot.role === "accessory")
      .map((slot) => slot.options[0].region);
    let lower = picked.filter((region) => region === "lower").length;
    let upper = picked.length - lower;
    const halves: ("lower" | "upper")[] = [];
    for (let i = 0; i < open; i++) {
      if (lower <= upper) {
        halves.push("lower");
        lower++;
      } else {
        halves.push("upper");
        upper++;
      }
    }
    for (const half of ["lower", "upper"] as const) {
      const count = halves.filter((h) => h === half).length;
      if (count === 0) continue;
      const menus = deal(pool.filter((e) => e.region === half), count);
      for (const menu of menus) {
        add(
          "accessory",
          `a ${half}-body accessory that adds something the main lifts don't`,
          take(menu),
        );
      }
    }
  } else if (open > 0) {
    for (const menu of deal(pool, open)) {
      add(
        "accessory",
        "an accessory that adds something the lifts before it don't",
        menu,
      );
    }
  }

  // Finishers
  const core = fresh(
    levelled(
      here.filter((e) => e.region === "core"),
      shape.finisher,
      difficulty,
    ),
    shape.finisher,
    history,
  );
  const hardCardio =
    difficulty <= 1
      ? []
      : fresh(
          here.filter(
            (e) =>
              e.region === "cardio" &&
              !easyCardio.includes(e) &&
              (e.level <= 2 || difficulty >= 4),
          ),
          1,
          history,
        );
  if (shape.finisher === 1) {
    add(
      "finisher",
      "a finisher: core work or a short burst of cardio",
      deal([...core, ...hardCardio], 1)[0],
    );
  } else {
    const [coreMenu, spare] = deal(core, 2);
    add("finisher", "core work", coreMenu);
    add(
      "finisher",
      "a finisher: more core or a short burst of cardio",
      [...hardCardio, ...spare].slice(0, MAX_OPTIONS),
    );
  }

  // Cool-down
  const stretches = fresh(
    here.filter((e) => e.region === "cooldown"),
    shape.cooldown,
    history,
  );
  const area = focus === "full_body" ? null : focus;
  const targeted = stretches.filter((e) => e.area === (area ?? "lower"));
  if (shape.cooldown === 1 || targeted.length === 0) {
    const from = area && targeted.length ? targeted : stretches;
    for (const menu of deal(from, shape.cooldown)) {
      add("cooldown", "a stretch for what she just trained", menu);
    }
  } else {
    const first = shuffled(targeted);
    const half = area ? Math.ceil(first.length / 2) : first.length;
    const firstMenu = first.slice(0, half).slice(0, MAX_OPTIONS);
    const rest = shuffled(stretches.filter((e) => !firstMenu.includes(e)));
    add("cooldown", "a stretch for what she just trained", firstMenu);
    add(
      "cooldown",
      "a second stretch, for a different muscle than the first",
      (area ? rest.filter((e) => !e.area || e.area === area) : rest).slice(
        0,
        MAX_OPTIONS,
      ),
    );
  }

  return slots;
}

type Scheme = { sets: number; reps: string; rest: number };

type Guide = {
  main: Scheme;
  accessory: Scheme;
  finisher: Scheme & { hold: number };
  effort: string;
};

const GUIDES: Record<number, Guide> = {
  1: {
    main: { sets: 2, reps: "10-12", rest: 75 },
    accessory: { sets: 2, reps: "10-12", rest: 60 },
    finisher: { sets: 2, reps: "10", hold: 20, rest: 30 },
    effort: "comfortable: she should end each set feeling she had four or five reps left",
  },
  2: {
    main: { sets: 3, reps: "10-12", rest: 75 },
    accessory: { sets: 2, reps: "12", rest: 60 },
    finisher: { sets: 2, reps: "10-12", hold: 25, rest: 30 },
    effort: "steady: two or three reps left at the end of each set",
  },
  3: {
    main: { sets: 3, reps: "10-12", rest: 75 },
    accessory: { sets: 3, reps: "12-15", rest: 60 },
    finisher: { sets: 3, reps: "12-15", hold: 30, rest: 30 },
    effort: "solid: the last two reps of each set should take real effort",
  },
  4: {
    main: { sets: 4, reps: "8-10", rest: 90 },
    accessory: { sets: 3, reps: "12-15", rest: 45 },
    finisher: { sets: 3, reps: "15", hold: 40, rest: 30 },
    effort: "hard: the last rep of each set should be a fight, with clean form",
  },
  5: {
    main: { sets: 4, reps: "8-10", rest: 90 },
    accessory: { sets: 3, reps: "15", rest: 45 },
    finisher: { sets: 3, reps: "15-20", hold: 45, rest: 20 },
    effort: "very hard: as heavy as she can move well, lowering every rep slowly",
  },
};

/** Her home dumbbell stops at 10 kg, so main lifts there get harder through reps and tempo. */
const HOME_MAIN_REPS: Record<number, string> = {
  1: "10-12",
  2: "12-15",
  3: "12-15",
  4: "15",
  5: "15-20",
};

export type SessionContext = {
  difficulty: number;
  location: TrainingLocation;
  durationMin: number;
};

function guideFor({ difficulty, location }: SessionContext): Guide {
  const guide = GUIDES[difficulty] ?? GUIDES[3];
  return location === "home"
    ? { ...guide, main: { ...guide.main, reps: HOME_MAIN_REPS[difficulty] ?? "12-15" } }
    : guide;
}

/** The numbers to prescribe today, written out so the model has no table to interpret. */
export function prescriptionGuide(context: SessionContext): string {
  const guide = guideFor(context);
  const lines = [
    `Effort today is ${guide.effort}.`,
    `Main lifts: ${guide.main.sets} sets of ${guide.main.reps}, rest_sec ${guide.main.rest}.`,
    `Accessories: ${guide.accessory.sets} sets of ${guide.accessory.reps}, rest_sec ${guide.accessory.rest}.`,
    `Core finishers: ${guide.finisher.sets} sets, rest_sec ${guide.finisher.rest}. Holds last ${guide.finisher.hold} seconds, rep moves get ${guide.finisher.reps}.`,
    "Warm-ups, cardio and stretches are timed by the app, so their numbers do not matter.",
  ];
  if (context.location === "home") {
    lines.push(
      "She is at home with one light dumbbell, so make dumbbell moves harder with a slow three-second lowering or a pause, and say so in the coach_note.",
    );
  }
  return lines.map((line) => `- ${line}`).join("\n");
}

const PER_SIDE = /\s*\b(per|each|a)\s+(leg|side|arm)\b/gi;
const READABLE_REPS = /^\d+(\s*-\s*\d+)?(\s*(seconds?|minutes?))?$/i;

const isMachineCardio = (entry: CatalogExercise) =>
  entry.region === "cardio" && !entry.places.includes("home");

/** Warm-ups, stretches and cardio follow a formula, so the app times them itself. */
function timedByApp(
  entry: CatalogExercise,
  role: Role,
  context: SessionContext,
): Scheme | null {
  const long = context.durationMin > 30;
  const machine = { sets: 1, reps: long ? "5 minutes" : "3 minutes", rest: 0 };

  if (role === "warmup") {
    if (isMachineCardio(entry)) return machine;
    if (entry.kind === "cardio") return { sets: 1, reps: "2 minutes", rest: 0 };
    return { sets: 1, reps: long ? "60 seconds" : "45 seconds", rest: 0 };
  }
  if (role === "cooldown") {
    return { sets: 1, reps: long ? "45 seconds" : "30 seconds", rest: 0 };
  }
  if (role === "finisher" && entry.region === "cardio") {
    if (isMachineCardio(entry)) return machine;
    const { sets, hold, rest } = guideFor(context).finisher;
    return { sets, reps: `${hold} seconds`, rest };
  }
  return null;
}

/**
 * The final numbers for one exercise. `strict` is for a freshly built session,
 * where the app owns the formulaic parts; a revision she asked for in the chat
 * is only tidied, so a request like "longer warm-up" survives.
 */
export function schemeFor(
  entry: CatalogExercise,
  role: Role,
  proposed: { sets: number; reps: string; rest_sec: number } | null,
  context: SessionContext,
  strict: boolean,
): Scheme {
  const guide = guideFor(context);
  const fallback: Scheme =
    timedByApp(entry, role, context) ??
    (role === "main" ? guide.main : role === "accessory" ? guide.accessory : guide.finisher);

  const offered = proposed?.reps.replace(PER_SIDE, "").trim() ?? "";
  let scheme: Scheme =
    proposed && READABLE_REPS.test(offered)
      ? { sets: proposed.sets, reps: offered, rest: proposed.rest_sec }
      : fallback;

  if (strict) {
    scheme = timedByApp(entry, role, context) ?? scheme;
    const counted = !/[a-z]/i.test(scheme.reps);
    if (entry.hold && counted) {
      scheme = { ...scheme, reps: `${guide.finisher.hold} seconds` };
    } else if (entry.sides && counted) {
      // A count per side takes twice as long, so one-sided moves stay short.
      scheme = { ...scheme, reps: context.difficulty >= 4 ? "12" : "10" };
    }
  }

  return entry.sides ? { ...scheme, reps: `${scheme.reps} per side` } : scheme;
}

/** Reads each exercise's part in the session back from the catalog and its position. */
export function rolesFor(names: string[]): Role[] {
  const entries = names.map((name) => catalogByName(name));
  const firstStrength = entries.findIndex(
    (entry) => entry?.region === "upper" || entry?.region === "lower",
  );
  return entries.map((entry, index) => {
    switch (entry?.region) {
      case "warmup":
        return "warmup";
      case "cooldown":
        return "cooldown";
      case "core":
        return "finisher";
      case "cardio":
        return firstStrength === -1 || index < firstStrength
          ? "warmup"
          : "finisher";
      default:
        return entry?.staple ? "main" : "accessory";
    }
  });
}

const SET_LIMITS: Record<Role, [number, number]> = {
  warmup: [1, 1],
  main: [2, 4],
  accessory: [2, 4],
  finisher: [1, 3],
  cooldown: [1, 1],
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Makes the plan honour the minutes she asked for. Sets come off the
 * accessories first and the main lifts last; spare time goes to the main lifts.
 */
export function fitToTime(
  plan: PlannedExercise[],
  durationMin: number,
): PlannedExercise[] {
  const roles = rolesFor(plan.map((exercise) => exercise.name));
  let items = plan.map((exercise, index) => {
    const role = roles[index];
    const single = role === "warmup" || role === "cooldown";
    return {
      role,
      exercise: {
        ...exercise,
        sets: clamp(exercise.sets, ...SET_LIMITS[role]),
        rest_sec: single ? 0 : clamp(exercise.rest_sec, 0, 120),
      },
    };
  });

  const minutes = () => estimateMinutes(items.map((item) => item.exercise));
  const mostSets = (role: Role, floor: number) =>
    items
      .filter((item) => item.role === role && item.exercise.sets > floor)
      .reverse()
      .sort((a, b) => b.exercise.sets - a.exercise.sets)[0];

  while (minutes() > durationMin * 1.08) {
    const trim =
      mostSets("accessory", SET_LIMITS.accessory[0]) ??
      mostSets("finisher", SET_LIMITS.finisher[0]);
    if (trim) {
      trim.exercise.sets--;
      continue;
    }
    const accessories = items.filter((item) => item.role === "accessory");
    if (accessories.length > 1) {
      const dropped = accessories[accessories.length - 1];
      items = items.filter((item) => item !== dropped);
      continue;
    }
    const main = mostSets("main", SET_LIMITS.main[0]);
    if (!main) break;
    main.exercise.sets--;
  }

  while (minutes() < durationMin * 0.85) {
    const grow = (["main", "accessory"] as const)
      .flatMap((role) =>
        items
          .filter(
            (item) =>
              item.role === role &&
              item.exercise.sets < SET_LIMITS[role][1] &&
              // A set of several minutes is cardio; doubling it is not a small step.
              readEffort(item.exercise.reps).setSeconds <= 120,
          )
          .sort((a, b) => a.exercise.sets - b.exercise.sets),
      )
      .at(0);
    if (!grow) break;
    grow.exercise.sets++;
    if (minutes() > durationMin * 1.08) {
      grow.exercise.sets--;
      break;
    }
  }

  return items.map((item) => item.exercise);
}

/** Where to start her next session, from how the last ones went. */
export function suggestNext(history: PastSession[]): {
  location: TrainingLocation;
  durationMin: number;
  focus: Focus;
  difficulty: number;
} {
  const sessionsAgo = (focus: Focus) => {
    const index = history.findIndex((session) => session.focus === focus);
    return index === -1 ? Infinity : index;
  };
  const focus = (["full_body", "lower", "upper"] as const).reduce(
    (stalest, candidate) =>
      sessionsAgo(candidate) > sessionsAgo(stalest) ? candidate : stalest,
  );

  const reference = history.find((session) => session.completed) ?? history[0];
  const step =
    reference?.feel === "easy" ? 1 : reference?.feel === "hard" ? -1 : 0;

  return {
    location: history[0]?.location ?? "gym",
    durationMin: history[0]?.durationMin ?? 45,
    focus,
    difficulty: reference ? clamp(reference.difficulty + step, 1, 5) : 3,
  };
}
