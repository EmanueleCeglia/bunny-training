import type { Limb, Pose } from "./figure";

/**
 * Two pictures per catalog exercise: where the move starts and where it ends.
 * Keys are catalog ids. Coordinates are explained in lib/figure.ts; the short
 * version is that she faces right, the floor is y = 0 and a standing hip sits
 * at y = 52.
 */
type Pair = [Pose, Pose];
type Limbs = [Limb, Limb];

// Side view building blocks.
const LEGS: Limbs = [
  [-87, -91],
  [-93, -89],
];
const ARMS: Limbs = [
  [-97, -84],
  [-85, -95],
];
const stand = (over: Partial<Pose> = {}): Pose => ({
  hip: 52,
  torso: 90,
  arms: ARMS,
  legs: LEGS,
  ...over,
});
/** Hands resting on the hips for a hip at (dx, hip). */
const handsOnHips = (hip: number, dx = 0): Limbs => [
  { to: [dx + 5, hip + 3], bend: -1 },
  { to: [dx + 3, hip + 3], bend: -1 },
];
/** Hands together in front of the chest, holding one dumbbell upright. */
const goblet = (hip: number, dx = 0): Limbs => [
  { to: [dx + 10, hip + 22] },
  { to: [dx + 8, hip + 22] },
];
const SQUAT_LEGS: Limbs = [{ to: [1, 5] }, { to: [-1, 5] }];

/** High plank on the hands with the body in one straight line. */
const plank = (dx = 0, over: Partial<Pose> = {}): Pose => ({
  hip: 25.5,
  dx,
  torso: 20.6,
  head: 10,
  legs: [
    [200.6, 200.6, -65],
    [199.5, 201.5, -65],
  ],
  arms: [{ to: [dx + 26, 4] }, { to: [dx + 23, 4] }],
  ...over,
});

/** On hands and knees. */
const allFours = (over: Partial<Pose> = {}): Pose => ({
  hip: 29,
  torso: 12,
  head: 5,
  legs: [
    [-90, 180, 180],
    [-93, 178, 180],
  ],
  arms: [{ to: [27, 4] }, { to: [24, 4] }],
  ...over,
});

/** On the back, head to the left, knees bent and feet flat. */
const lying = (over: Partial<Pose> = {}): Pose => ({
  hip: 7.5,
  torso: 180,
  head: 168,
  legs: [{ to: [24, 5] }, { to: [21, 5] }],
  arms: [
    [-6, -4],
    [-8, -6],
  ],
  props: [{ t: "mat" }],
  ...over,
});

/** Sitting upright on a machine seat with the feet on the floor. */
const seated = (over: Partial<Pose> = {}): Pose => ({
  hip: 30,
  torso: 95,
  legs: [
    [-3, -91],
    [-6, -93],
  ],
  arms: ARMS,
  ...over,
});

// Front view building blocks.
const FRONT_LEGS: Limbs = [
  [-94, -90],
  [-86, -90],
];
const FRONT_ARMS: Limbs = [
  [-100, -95],
  [-80, -85],
];
const front = (over: Partial<Pose> = {}): Pose => ({
  view: "front",
  hip: 52,
  torso: 90,
  arms: FRONT_ARMS,
  legs: FRONT_LEGS,
  ...over,
});

export const MOVES: Record<string, Pair> = {
  // Warm-up
  arm_circles: [
    front({
      arms: [
        [178, 180],
        [2, 0],
      ],
      props: [
        { t: "arc", at: "h0", r: 8, from: 100, to: 420 },
        { t: "arc", at: "h1", r: 8, from: 80, to: -240 },
      ],
    }),
    front({
      arms: [
        [130, 130],
        [50, 50],
      ],
      props: [
        { t: "arc", at: "h0", r: 8, from: 100, to: 420 },
        { t: "arc", at: "h1", r: 8, from: 80, to: -240 },
      ],
    }),
  ],
  leg_swings: [
    {
      torso: 90,
      arms: [
        [-115, -100],
        [-30, -15],
      ],
      legs: [
        [-35, -50],
        [-90, -90],
      ],
    },
    {
      torso: 90,
      arms: [
        [-40, -25],
        [-120, -105],
      ],
      legs: [
        [-140, -120],
        [-90, -90],
      ],
    },
  ],
  hip_circles: [
    front({
      hip: 50,
      dx: -4,
      torso: 97,
      legs: [{ to: [-14, 5] }, { to: [14, 5] }],
      arms: [{ to: [-14, 53] }, { to: [6, 53] }],
      props: [{ t: "arc", at: "hip", r: 17, from: 200, to: 340 }],
    }),
    front({
      hip: 50,
      dx: 4,
      torso: 83,
      legs: [{ to: [-14, 5] }, { to: [14, 5] }],
      arms: [{ to: [-6, 53] }, { to: [14, 53] }],
      props: [{ t: "arc", at: "hip", r: 17, from: 340, to: 200 }],
    }),
  ],
  cat_cow: [allFours({ bend: 7, head: -45 }), allFours({ bend: -6, head: 45 })],
  inchworm: [
    {
      hip: 50,
      torso: -40,
      head: -25,
      legs: SQUAT_LEGS,
      arms: [{ to: [38, 4] }, { to: [35, 4] }],
    },
    plank(45),
  ],
  march_in_place: [
    {
      torso: 90,
      arms: [
        [-130, -105],
        [-45, -5],
      ],
      legs: [
        [-8, -95],
        [-90, -90],
      ],
    },
    {
      torso: 90,
      arms: [
        [-45, -5],
        [-130, -105],
      ],
      legs: [
        [-90, -90],
        [-8, -95],
      ],
    },
  ],

  // Upper body
  lat_pulldown: [
    seated({
      torso: 100,
      arms: [{ to: [2, 87] }, { to: [0, 87] }],
      props: [
        { t: "seat" },
        { t: "pad", at: "k0", side: "top" },
        { t: "cable", at: "h0", to: [2, 118], post: -36 },
      ],
    }),
    seated({
      torso: 100,
      arms: [{ to: [6, 60] }, { to: [4, 60] }],
      props: [
        { t: "seat" },
        { t: "pad", at: "k0", side: "top" },
        { t: "cable", at: "h0", to: [2, 118], post: -36 },
      ],
    }),
  ],
  seated_cable_row: [
    {
      hip: 22,
      torso: 90,
      legs: [
        { to: [44, 20], bend: 1 },
        { to: [42, 19], bend: 1 },
      ],
      arms: [{ to: [30, 44] }, { to: [28, 44] }],
      props: [
        { t: "bench", x: [-14, 14], top: 14.5 },
        { t: "plate", leg: 0 },
        { t: "cable", at: "h0", to: [64, 20], post: 6 },
      ],
    },
    {
      hip: 22,
      torso: 90,
      legs: [
        { to: [44, 20], bend: 1 },
        { to: [42, 19], bend: 1 },
      ],
      arms: [
        { to: [12, 38], bend: -1 },
        { to: [10, 38], bend: -1 },
      ],
      props: [
        { t: "bench", x: [-14, 14], top: 14.5 },
        { t: "plate", leg: 0 },
        { t: "cable", at: "h0", to: [64, 20], post: 6 },
      ],
    },
  ],
  chest_press_machine: [
    seated({
      arms: [{ to: [10, 56] }, { to: [8, 56] }],
      props: [{ t: "seat", back: true }, { t: "grip", at: "h0" }],
    }),
    seated({
      arms: [{ to: [28, 57] }, { to: [26, 57] }],
      props: [{ t: "seat", back: true }, { t: "grip", at: "h0" }],
    }),
  ],
  shoulder_press_machine: [
    seated({
      arms: [{ to: [6, 62] }, { to: [4, 62] }],
      props: [{ t: "seat", back: true }, { t: "grip", at: "h0" }],
    }),
    seated({
      arms: [{ to: [2, 87] }, { to: [0, 87] }],
      props: [{ t: "seat", back: true }, { t: "grip", at: "h0" }],
    }),
  ],
  assisted_pull_up: [
    {
      hip: 40,
      torso: 95,
      legs: [
        [-90, 200, 200],
        [-92, 198, 200],
      ],
      arms: [{ to: [8, 97] }, { to: [6, 97] }],
      props: [
        { t: "pad", at: "k0", side: "under", post: true },
        { t: "bar", at: [8, 98], post: -34 },
      ],
    },
    {
      hip: 56,
      torso: 95,
      legs: [
        [-90, 200, 200],
        [-92, 198, 200],
      ],
      arms: [{ to: [8, 97] }, { to: [6, 97] }],
      props: [
        { t: "pad", at: "k0", side: "under", post: true },
        { t: "bar", at: [8, 98], post: -34 },
      ],
    },
  ],
  triceps_pushdown: [
    stand({
      torso: 82,
      arms: [
        { to: [12, 72], bend: -1 },
        { to: [10, 72], bend: -1 },
      ],
      props: [{ t: "cable", at: "h0", to: [16, 122], post: 10 }],
    }),
    stand({
      torso: 82,
      arms: [{ to: [10, 50] }, { to: [8, 50] }],
      props: [{ t: "cable", at: "h0", to: [16, 122], post: 10 }],
    }),
  ],
  face_pull: [
    stand({
      torso: 95,
      arms: [{ to: [28, 84] }, { to: [26, 84] }],
      props: [{ t: "cable", at: "h0", to: [64, 88], post: 6 }],
    }),
    stand({
      torso: 95,
      arms: [
        { to: [10, 92], bend: 1 },
        { to: [8, 92], bend: 1 },
      ],
      props: [{ t: "cable", at: "h0", to: [64, 88], post: 6 }],
    }),
  ],
  db_bench_press: [
    {
      hip: 37.5,
      torso: 180,
      legs: [{ to: [24, 5] }, { to: [21, 5] }],
      arms: [
        [-25, 90],
        [-28, 88],
      ],
      props: [
        { t: "bench", x: [-46, 12], top: 30 },
        { t: "db", at: "h0" },
        { t: "db", at: "h1" },
      ],
    },
    {
      hip: 37.5,
      torso: 180,
      legs: [{ to: [24, 5] }, { to: [21, 5] }],
      arms: [
        [90, 90],
        [88, 88],
      ],
      props: [
        { t: "bench", x: [-46, 12], top: 30 },
        { t: "db", at: "h0" },
        { t: "db", at: "h1" },
      ],
    },
  ],
  db_shoulder_press: [
    seated({
      torso: 92,
      arms: [{ to: [8, 64] }, { to: [6, 64] }],
      props: [
        { t: "seat", back: true },
        { t: "db", at: "h0" },
        { t: "db", at: "h1" },
      ],
    }),
    seated({
      torso: 92,
      arms: [{ to: [3, 88] }, { to: [1, 88] }],
      props: [
        { t: "seat", back: true },
        { t: "db", at: "h0" },
        { t: "db", at: "h1" },
      ],
    }),
  ],
  db_lateral_raise: [
    front({
      arms: [
        [-102, -100],
        [-78, -80],
      ],
      props: [
        { t: "db", at: "h0", angle: 90 },
        { t: "db", at: "h1", angle: 90 },
      ],
    }),
    front({
      arms: [
        [178, 180],
        [2, 0],
      ],
      props: [
        { t: "db", at: "h0", angle: 90 },
        { t: "db", at: "h1", angle: 90 },
      ],
    }),
  ],
  db_biceps_curl: [
    stand({
      arms: [
        [-92, -88],
        [-88, -92],
      ],
      props: [
        { t: "db", at: "h0" },
        { t: "db", at: "h1" },
      ],
    }),
    stand({
      arms: [
        [-95, 75],
        [-90, 78],
      ],
      props: [
        { t: "db", at: "h0" },
        { t: "db", at: "h1" },
      ],
    }),
  ],
  one_arm_row: [
    {
      hip: 44,
      torso: 25,
      head: 15,
      legs: [{ to: [-22, 5] }, { to: [18, 5] }],
      arms: [[-90, -90], { to: [14, 30] }],
      props: [{ t: "db", at: "h0" }],
    },
    {
      hip: 44,
      torso: 25,
      head: 15,
      legs: [{ to: [-22, 5] }, { to: [18, 5] }],
      arms: [[150, -95], { to: [14, 30] }],
      props: [{ t: "db", at: "h0" }],
    },
  ],
  one_arm_press: [
    stand({
      arms: [{ to: [7, 82] }, handsOnHips(52)[1]],
      props: [{ t: "db", at: "h0" }],
    }),
    stand({
      arms: [[88, 90], handsOnHips(52)[1]],
      props: [{ t: "db", at: "h0" }],
    }),
  ],
  one_arm_floor_press: [
    lying({
      arms: [
        [-10, 90],
        [-8, -5],
      ],
      props: [{ t: "mat" }, { t: "db", at: "h0" }],
    }),
    lying({
      arms: [
        [90, 90],
        [-8, -5],
      ],
      props: [{ t: "mat" }, { t: "db", at: "h0" }],
    }),
  ],
  one_arm_lateral_raise: [
    front({
      arms: [{ to: [-10, 55] }, [-82, -84]],
      props: [{ t: "db", at: "h1", angle: 90 }],
    }),
    front({
      arms: [{ to: [-10, 55] }, [2, 0]],
      props: [{ t: "db", at: "h1", angle: 90 }],
    }),
  ],
  hammer_curl: [
    stand({
      arms: [
        [-92, -88],
        [-85, -95],
      ],
      props: [{ t: "db", at: "h0", angle: 90 }],
    }),
    stand({
      arms: [
        [-95, 75],
        [-85, -95],
      ],
      props: [{ t: "db", at: "h0", angle: 90 }],
    }),
  ],
  overhead_triceps_ext: [
    stand({
      armBehind: true,
      arms: [
        [102, -115],
        [100, -112],
      ],
      props: [{ t: "db", at: "h0", angle: 90 }],
    }),
    stand({
      arms: [
        [95, 95],
        [93, 93],
      ],
      props: [{ t: "db", at: "h0", angle: 90 }],
    }),
  ],
  db_pullover: [
    lying({
      arms: [
        [170, 172],
        [168, 170],
      ],
      props: [{ t: "mat" }, { t: "db", at: "h0", angle: 90 }],
    }),
    lying({
      arms: [
        [85, 85],
        [83, 83],
      ],
      props: [{ t: "mat" }, { t: "db", at: "h0", angle: 90 }],
    }),
  ],
  incline_push_up: [
    {
      hip: 42.2,
      torso: 45,
      head: 35,
      legs: [
        [225, 225, -55],
        [224, 226, -55],
      ],
      arms: [{ to: [22, 30] }, { to: [20, 30] }],
      props: [{ t: "bench", x: [12, 36], top: 26 }],
    },
    {
      hip: 31.1,
      dx: 8.3,
      torso: 28,
      head: 18,
      legs: [
        [208, 208, -60],
        [207, 209, -60],
      ],
      arms: [{ to: [22, 30] }, { to: [20, 30] }],
      props: [{ t: "bench", x: [12, 36], top: 26 }],
    },
  ],
  knee_push_up: [
    {
      hip: 18.8,
      torso: 36.7,
      head: 25,
      legs: [
        [216.7, 160],
        [215, 162],
      ],
      arms: [{ to: [24, 4] }, { to: [22, 4] }],
      props: [{ t: "mat" }],
    },
    {
      hip: 10.2,
      dx: 4.1,
      torso: 14,
      head: 8,
      legs: [
        [194, 160],
        [193, 162],
      ],
      arms: [{ to: [24, 4] }, { to: [22, 4] }],
      props: [{ t: "mat" }],
    },
  ],
  push_up: [
    plank(0),
    {
      hip: 15.5,
      dx: 2.5,
      torso: 8,
      head: 0,
      legs: [
        [188, 188, -75],
        [187, 189, -75],
      ],
      arms: [{ to: [26, 4] }, { to: [23, 4] }],
    },
  ],
  bench_dip: [
    {
      hip: 34,
      torso: 90,
      legs: [{ to: [38, 5] }, { to: [36, 5] }],
      arms: [{ to: [-8, 30] }, { to: [-10, 30] }],
      props: [{ t: "bench", x: [-36, -8], top: 26 }],
    },
    {
      hip: 20,
      torso: 90,
      legs: [{ to: [38, 5] }, { to: [36, 5] }],
      arms: [
        { to: [-8, 30], bend: -1 },
        { to: [-10, 30], bend: -1 },
      ],
      props: [{ t: "bench", x: [-36, -8], top: 26 }],
    },
  ],
  pike_push_up: [
    {
      hip: 48,
      torso: -35,
      head: -70,
      legs: [{ to: [-24, 6], foot: -60 }, { to: [-26, 6], foot: -60 }],
      arms: [{ to: [30, 4] }, { to: [28, 4] }],
    },
    {
      hip: 48,
      dx: 2,
      torso: -55,
      head: -45,
      legs: [{ to: [-24, 6], foot: -60 }, { to: [-26, 6], foot: -60 }],
      arms: [{ to: [30, 4] }, { to: [28, 4] }],
    },
  ],

  // Core
  plank: [
    {
      hip: 11.8,
      torso: 17.7,
      head: 12,
      legs: [
        [197.7, 180, 180],
        [196, 182, 180],
      ],
      arms: [
        [-90, 0],
        [-92, 2],
      ],
      props: [{ t: "mat" }],
    },
    {
      hip: 16,
      torso: 8.5,
      head: 5,
      legs: [
        [188.5, 188.5, -80],
        [187.5, 189.5, -80],
      ],
      arms: [
        [-90, 0],
        [-92, 2],
      ],
      props: [{ t: "mat" }],
    },
  ],
  side_plank: [
    front({
      hip: 12.6,
      torso: 145,
      legs: [
        [-4, -4, -4],
        [-2, -2, -2],
      ],
      arms: [[-90, 180], { to: [4, 20] }],
      props: [{ t: "mat" }],
    }),
    front({
      hip: 21.6,
      torso: 163,
      legs: [
        [-14, -14, -14],
        [-12, -12, -12],
      ],
      arms: [
        [-90, 180],
        [80, 80],
      ],
      props: [{ t: "mat" }],
    }),
  ],
  dead_bug: [
    lying({
      legs: [
        [90, 0, 90],
        [88, 2, 92],
      ],
      arms: [
        [90, 90],
        [88, 88],
      ],
    }),
    lying({
      legs: [
        [90, 0, 90],
        [8, 8, 8],
      ],
      armBehind: true,
      arms: [
        [130, 130],
        [88, 88],
      ],
    }),
  ],
  bird_dog: [
    allFours(),
    allFours({
      head: -20,
      arms: [[28, 28], { to: [24, 4] }],
      legs: [
        [-90, 180, 180],
        [178, 178, 178],
      ],
    }),
  ],
  heel_taps: [
    lying(),
    lying({
      torso: 170,
      head: 160,
      bend: 2,
      arms: [
        [-8, -6],
        [-10, -8],
      ],
    }),
  ],
  bicycle_crunch: [
    lying({
      torso: 165,
      head: 150,
      bend: 3,
      armBehind: true,
      legs: [
        [110, 0],
        [10, 10, 10],
      ],
      arms: [
        { to: [-40, 24], bend: 1 },
        { to: [-40, 24], bend: 1 },
      ],
    }),
    lying({
      torso: 165,
      head: 150,
      bend: 3,
      armBehind: true,
      legs: [
        [12, 12, 12],
        [112, 2],
      ],
      arms: [
        { to: [-40, 24], bend: 1 },
        { to: [-40, 24], bend: 1 },
      ],
    }),
  ],
  leg_raise: [
    lying({
      legs: [
        [12, 12, 12],
        [10, 10, 10],
      ],
      arms: [
        [-4, -4],
        [-6, -6],
      ],
    }),
    lying({
      legs: [
        [85, 85, 0],
        [83, 83, 0],
      ],
      arms: [
        [-4, -4],
        [-6, -6],
      ],
    }),
  ],
  russian_twist: [
    front({
      hip: 10.5,
      torso: 100,
      torsoLen: 0.82,
      short: { leg0: [0.4, 0.4], leg1: [0.4, 0.4] },
      legs: [
        [100, -80],
        [80, -100],
      ],
      arms: [{ to: [-24, 14] }, { to: [-20, 16] }],
      props: [{ t: "mat" }, { t: "db", at: "h1", angle: 90 }],
    }),
    front({
      hip: 10.5,
      torso: 80,
      torsoLen: 0.82,
      short: { leg0: [0.4, 0.4], leg1: [0.4, 0.4] },
      legs: [
        [100, -80],
        [80, -100],
      ],
      arms: [{ to: [20, 16] }, { to: [24, 14] }],
      props: [{ t: "mat" }, { t: "db", at: "h0", angle: 90 }],
    }),
  ],
  plank_shoulder_taps: [plank(0), plank(0, { arms: [{ to: [23, 31] }, { to: [23, 4] }] })],
  hollow_hold: [
    lying({
      legs: [
        [2, 2, 2],
        [0, 0, 0],
      ],
      arms: [
        [-4, -4],
        [-6, -6],
      ],
    }),
    lying({
      torso: 170,
      head: 165,
      bend: 4,
      legs: [
        [14, 14, 14],
        [12, 12, 12],
      ],
      armBehind: true,
      arms: [
        [128, 132],
        [124, 128],
      ],
    }),
  ],
  cable_woodchop: [
    front({
      hip: 50,
      torso: 86,
      legs: [{ to: [-14, 5] }, { to: [14, 5] }],
      arms: [{ to: [20, 96] }, { to: [24, 98] }],
      props: [{ t: "cable", at: "h1", to: [54, 112], post: 8 }],
    }),
    front({
      hip: 50,
      torso: 96,
      legs: [{ to: [-14, 5] }, { to: [14, 5] }],
      arms: [{ to: [-22, 44] }, { to: [-18, 42] }],
      props: [{ t: "cable", at: "h1", to: [54, 112], post: 8 }],
    }),
  ],

  // Lower body
  leg_press: [
    {
      hip: 22,
      torso: 128,
      head: 105,
      legs: [
        { to: [22, 46], bend: 1 },
        { to: [20, 44], bend: 1 },
      ],
      arms: [
        [-60, -20],
        [-65, -25],
      ],
      props: [{ t: "seat", back: true }, { t: "plate", leg: 0 }],
    },
    {
      hip: 22,
      torso: 128,
      head: 105,
      legs: [
        { to: [34, 58], bend: 1 },
        { to: [32, 56], bend: 1 },
      ],
      arms: [
        [-60, -20],
        [-65, -25],
      ],
      props: [{ t: "seat", back: true }, { t: "plate", leg: 0 }],
    },
  ],
  leg_extension: [
    seated({
      hip: 32,
      legs: [
        [-2, -95],
        [-4, -93],
      ],
      arms: [
        [-80, -10],
        [-85, -15],
      ],
      props: [{ t: "seat", back: true }, { t: "pad", at: "a0", side: "front" }],
    }),
    seated({
      hip: 32,
      legs: [
        [-2, 5],
        [-4, 7],
      ],
      arms: [
        [-80, -10],
        [-85, -15],
      ],
      props: [{ t: "seat", back: true }, { t: "pad", at: "a0", side: "front" }],
    }),
  ],
  leg_curl: [
    seated({
      hip: 32,
      legs: [
        [-2, -5],
        [-4, -7],
      ],
      arms: [
        [-80, -10],
        [-85, -15],
      ],
      props: [
        { t: "seat", back: true },
        { t: "pad", at: "a0", side: "back" },
        { t: "pad", at: "k0", side: "top" },
      ],
    }),
    seated({
      hip: 32,
      legs: [
        [-2, -100],
        [-4, -102],
      ],
      arms: [
        [-80, -10],
        [-85, -15],
      ],
      props: [
        { t: "seat", back: true },
        { t: "pad", at: "a0", side: "back" },
        { t: "pad", at: "k0", side: "top" },
      ],
    }),
  ],
  hip_abduction: [
    front({
      hip: 34,
      short: { leg0: 0.3, leg1: 0.3 },
      legs: [
        [-60, -90],
        [-120, -90],
      ],
      arms: [
        [-105, -90],
        [-75, -90],
      ],
      props: [
        { t: "seat", back: true },
        { t: "pad", at: "k0", dx: -8 },
        { t: "pad", at: "k1", dx: 8 },
      ],
    }),
    front({
      hip: 34,
      short: { leg0: 0.3, leg1: 0.3 },
      legs: [
        [-150, -100],
        [-30, -80],
      ],
      arms: [
        [-105, -90],
        [-75, -90],
      ],
      props: [
        { t: "seat", back: true },
        { t: "pad", at: "k0", dx: -8 },
        { t: "pad", at: "k1", dx: 8 },
      ],
    }),
  ],
  cable_kickback: [
    stand({
      hip: 51,
      torso: 65,
      head: 80,
      legs: [
        [-80, -95],
        [-92, -90],
      ],
      arms: [{ to: [34, 70] }, { to: [32, 70] }],
      props: [{ t: "cable", at: "a0", to: [30, 10], post: 6 }],
    }),
    stand({
      hip: 51,
      torso: 65,
      head: 80,
      legs: [
        [-150, -130],
        [-92, -90],
      ],
      arms: [{ to: [34, 70] }, { to: [32, 70] }],
      props: [{ t: "cable", at: "a0", to: [30, 10], post: 6 }],
    }),
  ],
  hip_thrust: [
    {
      hip: 17.9,
      dx: -5.7,
      torso: 145,
      head: 165,
      legs: [{ to: [24, 5] }, { to: [21, 5] }],
      arms: [{ to: [-3, 26] }, { to: [-5, 26] }],
      props: [
        { t: "bench", x: [-50, -24], top: 26 },
        { t: "db", at: "hip", dy: 10 },
      ],
    },
    {
      hip: 33.5,
      torso: 180,
      legs: [{ to: [24, 5] }, { to: [21, 5] }],
      arms: [{ to: [2, 42] }, { to: [0, 42] }],
      props: [
        { t: "bench", x: [-50, -24], top: 26 },
        { t: "db", at: "hip", dy: 10 },
      ],
    },
  ],
  goblet_squat: [
    stand({ arms: goblet(52), props: [{ t: "db", at: "h0", angle: 90 }] }),
    {
      hip: 28,
      dx: -12,
      torso: 58,
      head: 75,
      legs: SQUAT_LEGS,
      arms: [{ to: [10, 50] }, { to: [8, 50] }],
      props: [{ t: "db", at: "h0", angle: 90 }],
    },
  ],
  goblet_sumo_squat: [
    front({
      hip: 50,
      legs: [{ to: [-20, 5] }, { to: [20, 5] }],
      arms: [{ to: [-2, 46] }, { to: [2, 46] }],
      props: [{ t: "db", at: "h0", angle: 90, dy: -5 }],
    }),
    front({
      hip: 30,
      legs: [{ to: [-20, 5] }, { to: [20, 5] }],
      arms: [{ to: [-2, 26] }, { to: [2, 26] }],
      props: [{ t: "db", at: "h0", angle: 90, dy: -5 }],
    }),
  ],
  db_rdl: [
    stand({
      arms: [
        [-90, -90],
        [-88, -88],
      ],
      props: [{ t: "db", at: "h0" }],
    }),
    {
      hip: 47,
      dx: -10,
      torso: 18,
      head: 5,
      legs: SQUAT_LEGS,
      arms: [
        [-90, -90],
        [-88, -88],
      ],
      props: [{ t: "db", at: "h0" }],
    },
  ],
  goblet_reverse_lunge: [
    stand({ arms: goblet(52), props: [{ t: "db", at: "h0", angle: 90 }] }),
    {
      hip: 30,
      dx: -20,
      torso: 90,
      legs: [{ to: [-50, 9] }, { to: [2, 5] }],
      arms: goblet(30, -20),
      props: [{ t: "db", at: "h0", angle: 90 }],
    },
  ],
  step_up: [
    {
      hip: 50,
      torso: 85,
      legs: [{ to: [20, 23] }, { to: [-4, 5] }],
      arms: [
        [-130, -105],
        [-45, -5],
      ],
      props: [{ t: "bench", x: [6, 38], top: 18 }],
    },
    {
      hip: 66,
      dx: 18,
      torso: 90,
      legs: [{ to: [20, 23] }, [-20, -100]],
      arms: [
        [-45, -5],
        [-130, -105],
      ],
      props: [{ t: "bench", x: [6, 38], top: 18 }],
    },
  ],
  bulgarian_split_squat: [
    {
      hip: 46,
      torso: 90,
      legs: [{ to: [-34, 29], foot: 180 }, { to: [16, 5] }],
      arms: handsOnHips(46),
      props: [{ t: "bench", x: [-56, -30], top: 24 }],
    },
    {
      hip: 28,
      dx: -2,
      torso: 90,
      legs: [{ to: [-34, 29], foot: 180 }, { to: [16, 5] }],
      arms: handsOnHips(28, -2),
      props: [{ t: "bench", x: [-56, -30], top: 24 }],
    },
  ],
  bodyweight_squat: [
    stand(),
    {
      hip: 28,
      dx: -12,
      torso: 58,
      head: 75,
      legs: SQUAT_LEGS,
      arms: [
        [5, 5],
        [3, 3],
      ],
    },
  ],
  reverse_lunge: [
    stand({ arms: handsOnHips(52) }),
    {
      hip: 30,
      dx: -20,
      torso: 90,
      legs: [{ to: [-50, 9] }, { to: [2, 5] }],
      arms: handsOnHips(30, -20),
    },
  ],
  curtsy_lunge: [
    front({ arms: [{ to: [-2, 74] }, { to: [2, 74] }] }),
    front({
      hip: 41,
      dx: 4,
      torso: 92,
      short: { leg0: 0.55 },
      legs: [
        [-100, -90],
        [-115, 210, 190],
      ],
      arms: [{ to: [0, 63] }, { to: [5, 63] }],
    }),
  ],
  glute_bridge: [
    lying(),
    lying({
      hip: 21.1,
      dx: -3.4,
      torso: 210,
      head: 150,
      arms: [
        [-4, -4],
        [-6, -6],
      ],
    }),
  ],
  single_leg_bridge: [
    lying({ legs: [[30, 30, 30], { to: [21, 5] }] }),
    lying({
      hip: 21.1,
      dx: -3.4,
      torso: 210,
      head: 150,
      legs: [[30, 30, 30], { to: [21, 5] }],
      arms: [
        [-4, -4],
        [-6, -6],
      ],
    }),
  ],
  donkey_kick: [
    allFours(),
    allFours({
      legs: [
        [175, 85, 175],
        [-93, 178, 180],
      ],
    }),
  ],
  fire_hydrant: [
    allFours(),
    allFours({
      short: { leg0: 0.25 },
      legs: [
        [-90, 180, 180],
        [-93, 178, 180],
      ],
    }),
  ],
  side_leg_raise: [
    front({
      hip: 13,
      torso: 180,
      legs: [
        [0, 0, 0],
        [-5, -5, -5],
      ],
      arms: [[175, 175], { to: [-18, 4] }],
      props: [{ t: "mat" }],
    }),
    front({
      hip: 13,
      torso: 180,
      legs: [
        [0, 0, 0],
        [30, 30, 30],
      ],
      arms: [[175, 175], { to: [-18, 4] }],
      props: [{ t: "mat" }],
    }),
  ],
  wall_sit: [
    {
      hip: 46,
      torso: 90,
      legs: [{ to: [24, 5] }, { to: [22, 5] }],
      arms: ARMS,
      props: [{ t: "wall", x: -11 }],
    },
    {
      hip: 28,
      torso: 90,
      legs: [
        [0, -90],
        [-2, -92],
      ],
      arms: [{ to: [16, 33] }, { to: [14, 33] }],
      props: [{ t: "wall", x: -11 }],
    },
  ],
  calf_raise: [
    {
      torso: 90,
      legs: [
        [-88, -90, 0],
        [-92, -90, 0],
      ],
      arms: handsOnHips(0),
    },
    {
      torso: 90,
      legs: [
        [-88, -90, -45],
        [-92, -90, -45],
      ],
      arms: handsOnHips(0),
    },
  ],

  // Cardio
  treadmill_walk: [
    {
      lift: 6,
      torso: 88,
      legs: [
        [-65, -80],
        [-115, -110],
      ],
      arms: [
        [-120, -100],
        [-55, -20],
      ],
      props: [{ t: "treadmill" }],
    },
    {
      lift: 6,
      torso: 88,
      legs: [
        [-115, -110],
        [-65, -80],
      ],
      arms: [
        [-55, -20],
        [-120, -100],
      ],
      props: [{ t: "treadmill" }],
    },
  ],
  bike: [
    {
      hip: 54,
      torso: 62,
      head: 80,
      legs: [{ to: [24, 29] }, { to: [12, 17] }],
      arms: [{ to: [36, 66] }, { to: [34, 66] }],
      props: [{ t: "bike" }],
    },
    {
      hip: 54,
      torso: 62,
      head: 80,
      legs: [{ to: [12, 17] }, { to: [24, 29] }],
      arms: [{ to: [36, 66] }, { to: [34, 66] }],
      props: [{ t: "bike" }],
    },
  ],
  elliptical: [
    {
      hip: 54,
      torso: 88,
      legs: [{ to: [16, 16] }, { to: [-14, 10] }],
      arms: [{ to: [10, 66] }, { to: [24, 72] }],
      props: [{ t: "elliptical" }],
    },
    {
      hip: 54,
      torso: 88,
      legs: [{ to: [-14, 10] }, { to: [16, 16] }],
      arms: [{ to: [24, 72] }, { to: [10, 66] }],
      props: [{ t: "elliptical" }],
    },
  ],
  rower: [
    {
      hip: 16,
      torso: 70,
      head: 80,
      legs: [
        { to: [38, 14], bend: 1 },
        { to: [36, 13], bend: 1 },
      ],
      arms: [{ to: [36, 30] }, { to: [34, 30] }],
      props: [{ t: "rower" }, { t: "plate", leg: 0 }],
    },
    {
      hip: 16,
      dx: -9,
      torso: 108,
      head: 95,
      legs: [
        { to: [38, 14], bend: 1 },
        { to: [36, 13], bend: 1 },
      ],
      arms: [
        { to: [-6, 36], bend: -1 },
        { to: [-8, 36], bend: -1 },
      ],
      props: [{ t: "rower" }, { t: "plate", leg: 0 }],
    },
  ],
  stair_climber: [
    {
      hip: 54,
      dx: -2,
      torso: 88,
      legs: [{ to: [0, 23] }, { to: [-16, 11] }],
      arms: [{ to: [22, 91] }, { to: [20, 91] }],
      props: [{ t: "stairs" }],
    },
    {
      hip: 66,
      dx: 10,
      torso: 88,
      legs: [{ to: [0, 23] }, { to: [16, 35] }],
      arms: [{ to: [22, 91] }, { to: [20, 91] }],
      props: [{ t: "stairs" }],
    },
  ],
  jumping_jacks: [
    front({ hip: undefined }),
    front({
      hip: undefined,
      lift: 4,
      arms: [
        [115, 105],
        [65, 75],
      ],
      legs: [
        [-112, -110],
        [-68, -70],
      ],
    }),
  ],
  high_knees: [
    {
      lift: 3,
      torso: 90,
      legs: [
        [5, -95],
        [-95, -95, -30],
      ],
      arms: [
        [-130, -100],
        [-40, 50],
      ],
    },
    {
      lift: 3,
      torso: 90,
      legs: [
        [-95, -95, -30],
        [5, -95],
      ],
      arms: [
        [-40, 50],
        [-130, -100],
      ],
    },
  ],
  mountain_climbers: [
    plank(0, { legs: [{ to: [8, 14] }, [199.5, 201.5, -65]] }),
    plank(0, { legs: [[200.6, 200.6, -65], { to: [6, 14] }] }),
  ],
  skaters: [
    front({
      hip: 42,
      dx: -26,
      torso: 75,
      legs: [{ to: [-28, 5] }, { to: [-8, 18] }],
      arms: [
        [-70, -60],
        [-10, 10],
      ],
      props: [{ t: "arc", at: "hip", r: 30, from: 60, to: 120 }],
    }),
    front({
      hip: 42,
      dx: 26,
      torso: 105,
      legs: [{ to: [8, 18] }, { to: [28, 5] }],
      arms: [
        [190, 170],
        [-110, -120],
      ],
      props: [{ t: "arc", at: "hip", r: 30, from: 120, to: 60 }],
    }),
  ],
  dumbbell_swing: [
    {
      hip: 46,
      dx: -10,
      torso: 25,
      head: 10,
      legs: SQUAT_LEGS,
      arms: [{ to: [-2, 32] }, { to: [-4, 32] }],
      props: [{ t: "db", at: "h0", angle: 90 }],
    },
    stand({
      arms: [
        [5, 5],
        [3, 3],
      ],
      props: [{ t: "db", at: "h0", angle: 90 }],
    }),
  ],
  burpee: [
    plank(0),
    {
      lift: 10,
      torso: 90,
      arms: [
        [65, 75],
        [72, 82],
      ],
      legs: [
        [-85, -95, -50],
        [-95, -90, -50],
      ],
    },
  ],

  // Cool-down
  childs_pose: [
    {
      hip: 13,
      torso: 90,
      legs: [
        [-20, 180, 180],
        [-22, 178, 180],
      ],
      arms: [{ to: [14, 14] }, { to: [12, 14] }],
      props: [{ t: "mat" }],
    },
    {
      hip: 13,
      torso: 5,
      head: -15,
      bend: 4,
      legs: [
        [-20, 180, 180],
        [-22, 178, 180],
      ],
      arms: [{ to: [56, 5] }, { to: [53, 5] }],
      props: [{ t: "mat" }],
    },
  ],
  cobra_stretch: [
    {
      hip: 7.5,
      torso: 0,
      head: 25,
      legs: [
        [180, 180, 180],
        [182, 180, 180],
      ],
      arms: [
        { to: [22, 4], bend: -1 },
        { to: [20, 4], bend: -1 },
      ],
      props: [{ t: "mat" }],
    },
    {
      hip: 7.5,
      torso: 32,
      head: 60,
      bend: -4,
      legs: [
        [180, 180, 180],
        [182, 180, 180],
      ],
      arms: [{ to: [30, 4] }, { to: [28, 4] }],
      props: [{ t: "mat" }],
    },
  ],
  hamstring_stretch: [
    {
      hip: 7.5,
      torso: 90,
      legs: [
        [0, 0, 90],
        [2, -2, 90],
      ],
      arms: [
        [-60, -30],
        [-65, -35],
      ],
      props: [{ t: "mat" }],
    },
    {
      hip: 7.5,
      torso: 35,
      head: 15,
      bend: 4,
      legs: [
        [0, 0, 90],
        [2, -2, 90],
      ],
      arms: [{ to: [44, 14] }, { to: [42, 14] }],
      props: [{ t: "mat" }],
    },
  ],
  quad_stretch: [
    stand(),
    stand({
      legs: [
        [-105, 115, 190],
        [-90, -90],
      ],
      arms: [{ to: [-14, 46] }, [-5, 5]],
    }),
  ],
  hip_flexor_stretch: [
    {
      hip: 28,
      torso: 90,
      legs: [[-92, 180, 180], { to: [26, 5] }],
      arms: [{ to: [22, 30] }, { to: [20, 30] }],
      props: [{ t: "mat" }],
    },
    {
      hip: 25,
      dx: 8,
      torso: 95,
      legs: [[-112, 180, 180], { to: [26, 5] }],
      arms: handsOnHips(25, 8),
      props: [{ t: "mat" }],
    },
  ],
  figure_four: [
    lying({
      short: { leg0: 0.7 },
      legs: [[85, 2], { to: [21, 5] }],
    }),
    lying({
      short: { leg0: 0.7 },
      legs: [
        [100, 10],
        [95, 10],
      ],
      arms: [{ to: [-4, 24] }, { to: [-6, 24] }],
    }),
  ],
  butterfly_stretch: [
    front({
      hip: 11,
      legs: [
        [160, -40],
        [20, 220],
      ],
      arms: [{ to: [-9, 8] }, { to: [9, 8] }],
      props: [{ t: "mat" }],
    }),
    front({
      hip: 11,
      torsoLen: 0.8,
      legs: [
        [188, -6],
        [-8, 186],
      ],
      arms: [{ to: [-9, 8] }, { to: [9, 8] }],
      props: [{ t: "mat" }],
    }),
  ],
  calf_stretch: [
    stand({
      arms: [
        [3, 3],
        [1, 1],
      ],
      props: [{ t: "wall", x: 36 }],
    }),
    {
      hip: 46,
      dx: -4,
      torso: 68,
      head: 80,
      legs: [{ to: [-30, 5] }, { to: [14, 5] }],
      arms: [{ to: [32, 78] }, { to: [30, 78] }],
      props: [{ t: "wall", x: 36 }],
    },
  ],
  chest_stretch: [
    stand({
      arms: [[180, 90], ARMS[1]],
      props: [{ t: "wall", x: -20 }],
    }),
    {
      hip: 52,
      dx: 8,
      torso: 80,
      head: 88,
      legs: [{ to: [20, 5] }, { to: [2, 5] }],
      arms: [{ to: [-16, 94] }, ARMS[1]],
      props: [{ t: "wall", x: -20 }],
    },
  ],
  shoulder_stretch: [
    front(),
    front({
      arms: [[-5, 0], { to: [6, 75] }],
    }),
  ],
  triceps_stretch: [
    front({
      arms: [FRONT_ARMS[0], [85, 88]],
    }),
    front({
      arms: [{ to: [7, 97] }, [95, 230]],
    }),
  ],
};
