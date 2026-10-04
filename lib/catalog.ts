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

export type CatalogExercise = {
  id: string;
  name: string;
  region: Region;
  places: TrainingLocation[];
  kind: ExerciseKind;
  /** 1 = beginner friendly, 2 = moderate, 3 = demanding. */
  level: 1 | 2 | 3;
  /** Set when the home version uses her single dumbbell. */
  dumbbell?: true;
};

const BOTH: TrainingLocation[] = ["gym", "home"];
const GYM: TrainingLocation[] = ["gym"];
const HOME: TrainingLocation[] = ["home"];

export const CATALOG: CatalogExercise[] = [
  // Warm-up
  { id: "arm_circles", name: "Arm circles", region: "warmup", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "leg_swings", name: "Leg swings", region: "warmup", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "hip_circles", name: "Hip circles", region: "warmup", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "cat_cow", name: "Cat-cow", region: "warmup", places: BOTH, kind: "stretch", level: 1 },
  { id: "inchworm", name: "Inchworm", region: "warmup", places: BOTH, kind: "bodyweight", level: 2 },
  { id: "march_in_place", name: "March in place", region: "warmup", places: HOME, kind: "cardio", level: 1 },

  // Upper body
  { id: "lat_pulldown", name: "Lat pulldown", region: "upper", places: GYM, kind: "machine", level: 1 },
  { id: "seated_cable_row", name: "Seated cable row", region: "upper", places: GYM, kind: "machine", level: 1 },
  { id: "chest_press_machine", name: "Chest press machine", region: "upper", places: GYM, kind: "machine", level: 1 },
  { id: "shoulder_press_machine", name: "Shoulder press machine", region: "upper", places: GYM, kind: "machine", level: 1 },
  { id: "assisted_pull_up", name: "Assisted pull-up", region: "upper", places: GYM, kind: "machine", level: 2 },
  { id: "triceps_pushdown", name: "Cable triceps pushdown", region: "upper", places: GYM, kind: "machine", level: 1 },
  { id: "face_pull", name: "Face pull", region: "upper", places: GYM, kind: "machine", level: 2 },
  { id: "db_bench_press", name: "Dumbbell bench press", region: "upper", places: GYM, kind: "free_weight", level: 2 },
  { id: "db_shoulder_press", name: "Dumbbell shoulder press", region: "upper", places: GYM, kind: "free_weight", level: 2 },
  { id: "db_lateral_raise", name: "Dumbbell lateral raise", region: "upper", places: GYM, kind: "free_weight", level: 1 },
  { id: "db_biceps_curl", name: "Dumbbell biceps curl", region: "upper", places: GYM, kind: "free_weight", level: 1 },
  { id: "one_arm_row", name: "One-arm dumbbell row", region: "upper", places: BOTH, kind: "free_weight", level: 1, dumbbell: true },
  { id: "one_arm_press", name: "One-arm dumbbell shoulder press", region: "upper", places: HOME, kind: "free_weight", level: 2, dumbbell: true },
  { id: "one_arm_floor_press", name: "One-arm dumbbell floor press", region: "upper", places: HOME, kind: "free_weight", level: 1, dumbbell: true },
  { id: "one_arm_lateral_raise", name: "One-arm lateral raise", region: "upper", places: HOME, kind: "free_weight", level: 1, dumbbell: true },
  { id: "hammer_curl", name: "Hammer curl", region: "upper", places: HOME, kind: "free_weight", level: 1, dumbbell: true },
  { id: "overhead_triceps_ext", name: "Overhead triceps extension", region: "upper", places: BOTH, kind: "free_weight", level: 1, dumbbell: true },
  { id: "db_pullover", name: "Dumbbell pullover", region: "upper", places: BOTH, kind: "free_weight", level: 2, dumbbell: true },
  { id: "incline_push_up", name: "Incline push-up", region: "upper", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "knee_push_up", name: "Knee push-up", region: "upper", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "push_up", name: "Push-up", region: "upper", places: BOTH, kind: "bodyweight", level: 3 },
  { id: "bench_dip", name: "Bench dip", region: "upper", places: BOTH, kind: "bodyweight", level: 2 },
  { id: "pike_push_up", name: "Pike push-up", region: "upper", places: HOME, kind: "bodyweight", level: 3 },

  // Core
  { id: "plank", name: "Plank", region: "core", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "side_plank", name: "Side plank", region: "core", places: BOTH, kind: "bodyweight", level: 2 },
  { id: "dead_bug", name: "Dead bug", region: "core", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "bird_dog", name: "Bird dog", region: "core", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "heel_taps", name: "Heel taps", region: "core", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "bicycle_crunch", name: "Bicycle crunch", region: "core", places: BOTH, kind: "bodyweight", level: 2 },
  { id: "leg_raise", name: "Lying leg raise", region: "core", places: BOTH, kind: "bodyweight", level: 2 },
  { id: "russian_twist", name: "Russian twist", region: "core", places: BOTH, kind: "free_weight", level: 2, dumbbell: true },
  { id: "plank_shoulder_taps", name: "Plank shoulder taps", region: "core", places: BOTH, kind: "bodyweight", level: 2 },
  { id: "hollow_hold", name: "Hollow hold", region: "core", places: BOTH, kind: "bodyweight", level: 3 },
  { id: "cable_woodchop", name: "Cable woodchop", region: "core", places: GYM, kind: "machine", level: 2 },

  // Lower body
  { id: "leg_press", name: "Leg press", region: "lower", places: GYM, kind: "machine", level: 1 },
  { id: "leg_extension", name: "Leg extension", region: "lower", places: GYM, kind: "machine", level: 1 },
  { id: "leg_curl", name: "Leg curl machine", region: "lower", places: GYM, kind: "machine", level: 1 },
  { id: "hip_abduction", name: "Hip abduction machine", region: "lower", places: GYM, kind: "machine", level: 1 },
  { id: "cable_kickback", name: "Cable glute kickback", region: "lower", places: GYM, kind: "machine", level: 2 },
  { id: "hip_thrust", name: "Hip thrust", region: "lower", places: BOTH, kind: "free_weight", level: 2, dumbbell: true },
  { id: "goblet_squat", name: "Goblet squat", region: "lower", places: BOTH, kind: "free_weight", level: 1, dumbbell: true },
  { id: "goblet_sumo_squat", name: "Goblet sumo squat", region: "lower", places: BOTH, kind: "free_weight", level: 1, dumbbell: true },
  { id: "db_rdl", name: "Dumbbell Romanian deadlift", region: "lower", places: BOTH, kind: "free_weight", level: 2, dumbbell: true },
  { id: "goblet_reverse_lunge", name: "Goblet reverse lunge", region: "lower", places: BOTH, kind: "free_weight", level: 2, dumbbell: true },
  { id: "step_up", name: "Step-up", region: "lower", places: BOTH, kind: "bodyweight", level: 2 },
  { id: "bulgarian_split_squat", name: "Bulgarian split squat", region: "lower", places: BOTH, kind: "bodyweight", level: 3 },
  { id: "bodyweight_squat", name: "Bodyweight squat", region: "lower", places: HOME, kind: "bodyweight", level: 1 },
  { id: "reverse_lunge", name: "Reverse lunge", region: "lower", places: HOME, kind: "bodyweight", level: 1 },
  { id: "curtsy_lunge", name: "Curtsy lunge", region: "lower", places: HOME, kind: "bodyweight", level: 2 },
  { id: "glute_bridge", name: "Glute bridge", region: "lower", places: BOTH, kind: "bodyweight", level: 1 },
  { id: "single_leg_bridge", name: "Single-leg glute bridge", region: "lower", places: BOTH, kind: "bodyweight", level: 2 },
  { id: "donkey_kick", name: "Donkey kicks", region: "lower", places: HOME, kind: "bodyweight", level: 1 },
  { id: "fire_hydrant", name: "Fire hydrants", region: "lower", places: HOME, kind: "bodyweight", level: 1 },
  { id: "side_leg_raise", name: "Side-lying leg raise", region: "lower", places: HOME, kind: "bodyweight", level: 1 },
  { id: "wall_sit", name: "Wall sit", region: "lower", places: BOTH, kind: "bodyweight", level: 2 },
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
  { id: "hamstring_stretch", name: "Seated hamstring stretch", region: "cooldown", places: BOTH, kind: "stretch", level: 1 },
  { id: "quad_stretch", name: "Standing quad stretch", region: "cooldown", places: BOTH, kind: "stretch", level: 1 },
  { id: "hip_flexor_stretch", name: "Kneeling hip flexor stretch", region: "cooldown", places: BOTH, kind: "stretch", level: 1 },
  { id: "figure_four", name: "Figure-four glute stretch", region: "cooldown", places: BOTH, kind: "stretch", level: 1 },
  { id: "butterfly_stretch", name: "Butterfly stretch", region: "cooldown", places: BOTH, kind: "stretch", level: 1 },
  { id: "calf_stretch", name: "Calf stretch", region: "cooldown", places: BOTH, kind: "stretch", level: 1 },
  { id: "chest_stretch", name: "Doorway chest stretch", region: "cooldown", places: BOTH, kind: "stretch", level: 1 },
  { id: "shoulder_stretch", name: "Cross-body shoulder stretch", region: "cooldown", places: BOTH, kind: "stretch", level: 1 },
  { id: "triceps_stretch", name: "Overhead triceps stretch", region: "cooldown", places: BOTH, kind: "stretch", level: 1 },
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
