import type { ExerciseKind, Focus, TrainingLocation } from "./types";

/**
 * The only exercises the trainer is allowed to pick from. Kept deliberately
 * short and everyday: Bunny trains for fun and health, not for a physique
 * show, so every move here is one she can learn from a single cue.
 *
 * Home means bodyweight plus ONE dumbbell of up to 10 kg. Anything that needs
 * two dumbbells, a bench, a bar or a cable is gym only.
 */
export type Region =
  | "warmup"
  | "upper"
  | "core"
  | "lower"
  | "cardio"
  | "cooldown";

/** The movement a strength exercise trains, used to balance a session and to find like-for-like swaps. */
export type Pattern = "push" | "pull" | "arms" | "squat" | "hinge" | "glute";

export type CatalogExercise = {
  id: string;
  name: string;
  region: Region;
  pattern?: Pattern;
  places: TrainingLocation[];
  kind: ExerciseKind;
  /** 1 = beginner friendly, 2 = moderate, 3 = demanding. */
  level: 1 | 2 | 3;
  /** For a stretch: the half of the body it loosens. Unset means the whole body. */
  area?: "upper" | "lower";
  /** Held still for time rather than counted in reps. */
  hold?: true;
  /** Done one side at a time, so the count she is given is for each side. */
  sides?: true;
  /** Set when the home version uses her single dumbbell. */
  dumbbell?: true;
  /**
   * A foundation lift she should come back to often, so she can see herself
   * get stronger at it. Everything else rotates between sessions.
   */
  staple?: true;
};

const BOTH: TrainingLocation[] = ["gym", "home"];
const GYM: TrainingLocation[] = ["gym"];
const HOME: TrainingLocation[] = ["home"];

export const CATALOG: CatalogExercise[] = [
  // Warm-up
  { id: "arm_circles", name: "Arm circles", region: "warmup", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "leg_swings", name: "Leg swings", region: "warmup", places: BOTH, kind: "bodyweight", level: 1, sides: true },
  { id: "hip_circles", name: "Hip circles", region: "warmup", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "cat_cow", name: "Cat-cow", region: "warmup", places: BOTH, kind: "stretch", level: 1 },
  { id: "inchworm", name: "Inchworm", region: "warmup", places: BOTH, kind: "bodyweight", level: 2 },
  { id: "march_in_place", name: "March in place", region: "warmup", places: HOME, kind: "cardio", level: 1 },

  // Upper body
  { id: "lat_pulldown", name: "Lat pulldown", region: "upper", pattern: "pull", places: GYM, kind: "machine", level: 1, staple: true },
  { id: "seated_cable_row", name: "Seated cable row", region: "upper", pattern: "pull", places: GYM, kind: "machine", level: 1, staple: true },
  { id: "chest_press_machine", name: "Chest press machine", region: "upper", pattern: "push", places: GYM, kind: "machine", level: 1, staple: true },
  { id: "shoulder_press_machine", name: "Shoulder press machine", region: "upper", pattern: "push", places: GYM, kind: "machine", level: 1 },
  { id: "assisted_pull_up", name: "Assisted pull-up", region: "upper", pattern: "pull", places: GYM, kind: "machine", level: 2 },
  { id: "triceps_pushdown", name: "Cable triceps pushdown", region: "upper", pattern: "arms", places: GYM, kind: "machine", level: 1 },
  { id: "face_pull", name: "Face pull", region: "upper", pattern: "pull", places: GYM, kind: "machine", level: 2 },
  { id: "db_bench_press", name: "Dumbbell bench press", region: "upper", pattern: "push", places: GYM, kind: "free_weight", level: 2 },
  { id: "db_shoulder_press", name: "Dumbbell shoulder press", region: "upper", pattern: "push", places: GYM, kind: "free_weight", level: 2, staple: true },
  { id: "db_lateral_raise", name: "Dumbbell lateral raise", region: "upper", pattern: "arms", places: GYM, kind: "free_weight", level: 1 },
  { id: "db_biceps_curl", name: "Dumbbell biceps curl", region: "upper", pattern: "arms", places: GYM, kind: "free_weight", level: 1 },
  { id: "one_arm_row", name: "One-arm dumbbell row", region: "upper", pattern: "pull", places: BOTH, kind: "free_weight", level: 1, sides: true, dumbbell: true, staple: true },
  { id: "one_arm_press", name: "One-arm dumbbell shoulder press", region: "upper", pattern: "push", places: HOME, kind: "free_weight", level: 2, sides: true, dumbbell: true, staple: true },
  { id: "one_arm_floor_press", name: "One-arm dumbbell floor press", region: "upper", pattern: "push", places: HOME, kind: "free_weight", level: 1, sides: true, dumbbell: true, staple: true },
  { id: "one_arm_lateral_raise", name: "One-arm lateral raise", region: "upper", pattern: "arms", places: HOME, kind: "free_weight", level: 1, sides: true, dumbbell: true },
  { id: "hammer_curl", name: "Hammer curl", region: "upper", pattern: "arms", places: HOME, kind: "free_weight", level: 1, sides: true, dumbbell: true },
  { id: "overhead_triceps_ext", name: "Overhead triceps extension", region: "upper", pattern: "arms", places: BOTH, kind: "free_weight", level: 1, dumbbell: true },
  { id: "db_pullover", name: "Dumbbell pullover", region: "upper", pattern: "pull", places: BOTH, kind: "free_weight", level: 2, dumbbell: true },
  { id: "incline_push_up", name: "Incline push-up", region: "upper", pattern: "push", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "knee_push_up", name: "Knee push-up", region: "upper", pattern: "push", places: BOTH, kind: "bodyweight", level: 1, staple: true },
  { id: "push_up", name: "Push-up", region: "upper", pattern: "push", places: BOTH, kind: "bodyweight", level: 3 },
  { id: "bench_dip", name: "Bench dip", region: "upper", pattern: "push", places: BOTH, kind: "bodyweight", level: 2 },
  { id: "pike_push_up", name: "Pike push-up", region: "upper", pattern: "push", places: HOME, kind: "bodyweight", level: 3 },

  // Core
  { id: "plank", name: "Plank", region: "core", places: BOTH, kind: "bodyweight", level: 1, hold: true },
  { id: "side_plank", name: "Side plank", region: "core", places: BOTH, kind: "bodyweight", level: 2, hold: true, sides: true },
  { id: "dead_bug", name: "Dead bug", region: "core", places: BOTH, kind: "bodyweight", level: 1, sides: true },
  { id: "bird_dog", name: "Bird dog", region: "core", places: BOTH, kind: "bodyweight", level: 1, sides: true },
  { id: "heel_taps", name: "Heel taps", region: "core", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "bicycle_crunch", name: "Bicycle crunch", region: "core", places: BOTH, kind: "bodyweight", level: 2 },
  { id: "leg_raise", name: "Lying leg raise", region: "core", places: BOTH, kind: "bodyweight", level: 2 },
  { id: "russian_twist", name: "Russian twist", region: "core", places: BOTH, kind: "free_weight", level: 2, dumbbell: true },
  { id: "plank_shoulder_taps", name: "Plank shoulder taps", region: "core", places: BOTH, kind: "bodyweight", level: 2 },
  { id: "hollow_hold", name: "Hollow hold", region: "core", places: BOTH, kind: "bodyweight", level: 3, hold: true },
  { id: "cable_woodchop", name: "Cable woodchop", region: "core", places: GYM, kind: "machine", level: 2, sides: true },

  // Lower body
  { id: "leg_press", name: "Leg press", region: "lower", pattern: "squat", places: GYM, kind: "machine", level: 1, staple: true },
  { id: "leg_extension", name: "Leg extension", region: "lower", pattern: "squat", places: GYM, kind: "machine", level: 1 },
  { id: "leg_curl", name: "Leg curl machine", region: "lower", pattern: "hinge", places: GYM, kind: "machine", level: 1 },
  { id: "hip_abduction", name: "Hip abduction machine", region: "lower", pattern: "glute", places: GYM, kind: "machine", level: 1 },
  { id: "cable_kickback", name: "Cable glute kickback", region: "lower", pattern: "glute", places: GYM, kind: "machine", level: 2, sides: true },
  { id: "hip_thrust", name: "Hip thrust", region: "lower", pattern: "glute", places: BOTH, kind: "free_weight", level: 2, dumbbell: true, staple: true },
  { id: "goblet_squat", name: "Goblet squat", region: "lower", pattern: "squat", places: BOTH, kind: "free_weight", level: 1, dumbbell: true, staple: true },
  { id: "goblet_sumo_squat", name: "Goblet sumo squat", region: "lower", pattern: "squat", places: BOTH, kind: "free_weight", level: 1, dumbbell: true },
  { id: "db_rdl", name: "Dumbbell Romanian deadlift", region: "lower", pattern: "hinge", places: BOTH, kind: "free_weight", level: 2, dumbbell: true, staple: true },
  { id: "goblet_reverse_lunge", name: "Goblet reverse lunge", region: "lower", pattern: "squat", places: BOTH, kind: "free_weight", level: 2, sides: true, dumbbell: true },
  { id: "step_up", name: "Step-up", region: "lower", pattern: "squat", places: BOTH, kind: "bodyweight", level: 2, sides: true },
  { id: "bulgarian_split_squat", name: "Bulgarian split squat", region: "lower", pattern: "squat", places: BOTH, kind: "bodyweight", level: 3, sides: true },
  { id: "bodyweight_squat", name: "Bodyweight squat", region: "lower", pattern: "squat", places: HOME, kind: "bodyweight", level: 1 },
  { id: "reverse_lunge", name: "Reverse lunge", region: "lower", pattern: "squat", places: HOME, kind: "bodyweight", level: 1, sides: true },
  { id: "curtsy_lunge", name: "Curtsy lunge", region: "lower", pattern: "squat", places: HOME, kind: "bodyweight", level: 2, sides: true },
  { id: "glute_bridge", name: "Glute bridge", region: "lower", pattern: "glute", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "single_leg_bridge", name: "Single-leg glute bridge", region: "lower", pattern: "glute", places: BOTH, kind: "bodyweight", level: 2, sides: true },
  { id: "donkey_kick", name: "Donkey kicks", region: "lower", pattern: "glute", places: HOME, kind: "bodyweight", level: 1, sides: true },
  { id: "fire_hydrant", name: "Fire hydrants", region: "lower", pattern: "glute", places: HOME, kind: "bodyweight", level: 1, sides: true },
  { id: "side_leg_raise", name: "Side-lying leg raise", region: "lower", pattern: "glute", places: HOME, kind: "bodyweight", level: 1, sides: true },
  { id: "wall_sit", name: "Wall sit", region: "lower", pattern: "squat", places: BOTH, kind: "bodyweight", level: 2, hold: true },
  { id: "calf_raise", name: "Standing calf raise", region: "lower", places: BOTH, kind: "bodyweight", level: 1 },

  // Cardio, usable as a warm-up or a finisher
  { id: "treadmill_walk", name: "Incline treadmill walk", region: "cardio", places: GYM, kind: "cardio", level: 1 },
  { id: "bike", name: "Stationary bike", region: "cardio", places: GYM, kind: "cardio", level: 1 },
  { id: "elliptical", name: "Elliptical", region: "cardio", places: GYM, kind: "cardio", level: 1 },
  { id: "rower", name: "Rowing machine", region: "cardio", places: GYM, kind: "cardio", level: 2 },
  { id: "stair_climber", name: "Stair climber", region: "cardio", places: GYM, kind: "cardio", level: 3 },
  { id: "jumping_jacks", name: "Jumping jacks", region: "cardio", places: HOME, kind: "cardio", level: 1 },
  { id: "high_knees", name: "High knees", region: "cardio", places: HOME, kind: "cardio", level: 2 },
  { id: "mountain_climbers", name: "Mountain climbers", region: "cardio", places: BOTH, kind: "cardio", level: 2 },
  { id: "skaters", name: "Skaters", region: "cardio", places: HOME, kind: "cardio", level: 2 },
  { id: "dumbbell_swing", name: "Dumbbell swing", region: "cardio", places: HOME, kind: "free_weight", level: 2, dumbbell: true },
  { id: "burpee", name: "Burpees", region: "cardio", places: BOTH, kind: "cardio", level: 3 },

  // Cool-down
  { id: "childs_pose", name: "Child's pose", region: "cooldown", places: BOTH, kind: "stretch", level: 1 },
  { id: "cobra_stretch", name: "Cobra stretch", region: "cooldown", places: BOTH, kind: "stretch", level: 1 },
  { id: "hamstring_stretch", name: "Seated hamstring stretch", region: "cooldown", area: "lower", places: BOTH, kind: "stretch", level: 1 },
  { id: "quad_stretch", name: "Standing quad stretch", region: "cooldown", area: "lower", places: BOTH, kind: "stretch", level: 1, sides: true },
  { id: "hip_flexor_stretch", name: "Kneeling hip flexor stretch", region: "cooldown", area: "lower", places: BOTH, kind: "stretch", level: 1, sides: true },
  { id: "figure_four", name: "Figure-four glute stretch", region: "cooldown", area: "lower", places: BOTH, kind: "stretch", level: 1, sides: true },
  { id: "butterfly_stretch", name: "Butterfly stretch", region: "cooldown", area: "lower", places: BOTH, kind: "stretch", level: 1 },
  { id: "calf_stretch", name: "Calf stretch", region: "cooldown", area: "lower", places: BOTH, kind: "stretch", level: 1, sides: true },
  { id: "chest_stretch", name: "Doorway chest stretch", region: "cooldown", area: "upper", places: BOTH, kind: "stretch", level: 1 },
  { id: "shoulder_stretch", name: "Cross-body shoulder stretch", region: "cooldown", area: "upper", places: BOTH, kind: "stretch", level: 1, sides: true },
  { id: "triceps_stretch", name: "Overhead triceps stretch", region: "cooldown", area: "upper", places: BOTH, kind: "stretch", level: 1, sides: true },
];

/** Core, cardio, warm-up and cool-down suit every focus; only the big muscle groups are filtered. */
const FOCUS_REGIONS: Record<Focus, Region[]> = {
  full_body: ["warmup", "upper", "core", "lower", "cardio", "cooldown"],
  upper: ["warmup", "upper", "core", "cardio", "cooldown"],
  lower: ["warmup", "lower", "core", "cardio", "cooldown"],
};

export const REGION_LABELS: Record<Region, string> = {
  warmup: "Warm-up",
  upper: "Upper body",
  core: "Core",
  lower: "Lower body",
  cardio: "Cardio (warm-up or finisher)",
  cooldown: "Cool-down",
};

export function catalogFor(
  location: TrainingLocation,
  focus: Focus,
): CatalogExercise[] {
  const regions = FOCUS_REGIONS[focus];
  return CATALOG.filter(
    (exercise) =>
      exercise.places.includes(location) && regions.includes(exercise.region),
  );
}

const byId = new Map(CATALOG.map((exercise) => [exercise.id, exercise]));
const byName = new Map(
  CATALOG.map((exercise) => [exercise.name.toLowerCase(), exercise]),
);

export function catalogById(id: string): CatalogExercise | undefined {
  return byId.get(id);
}

/** Sessions written before the catalog existed have names that won't match. */
export function catalogByName(name: string): CatalogExercise | undefined {
  return byName.get(name.trim().toLowerCase());
}
