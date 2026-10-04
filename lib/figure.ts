/**
 * A posable bunny mannequin. A pose is a handful of angles (or reach targets)
 * and this turns it into drawable points, so every exercise picture shares one
 * body and stays consistent.
 *
 * World units: x grows to the right, y grows UP from the floor (y = 0).
 * Angles are degrees: 0 points right, 90 points up.
 * Side view: she faces right. Front view: she faces the viewer, limb 0 is on
 * the viewer's left.
 */

/** Two segment angles, plus an optional foot angle for legs. */
export type Angles = [number, number] | [number, number, number];
/** Reach for a world point and let the elbow or knee bend to get there. */
export type Reach = { to: [number, number]; bend?: 1 | -1; foot?: number };
export type Limb = Angles | Reach;

export type Prop =
  | { t: "db"; at: Joint; angle?: number; dy?: number }
  | { t: "bench"; x: [number, number]; top: number; back?: "start" | "end" }
  | { t: "seat"; back?: boolean; width?: number }
  | { t: "cable"; at: Joint; to: [number, number]; post?: number }
  | { t: "lever"; at: Joint; to: [number, number] }
  | { t: "grip"; at: Joint }
  | { t: "pad"; at: Joint; side?: "front" | "back" | "top" | "under"; dx?: number; post?: boolean }
  | { t: "bar"; at: [number, number]; post: number }
  | { t: "wall"; x: number; from?: number }
  | { t: "mat" }
  | { t: "plate"; leg: 0 | 1 }
  | { t: "treadmill" }
  | { t: "bike" }
  | { t: "rower" }
  | { t: "elliptical" }
  | { t: "stairs" }
  | { t: "arc"; at: Joint; r: number; from: number; to: number };

export type Joint =
  | "hip"
  | "neck"
  | "head"
  | "sh0"
  | "sh1"
  | "e0"
  | "e1"
  | "h0"
  | "h1"
  | "k0"
  | "k1"
  | "a0"
  | "a1"
  | "t0"
  | "t1";

export type Pose = {
  view?: "side" | "front";
  /** Hip height above the floor. Omit it to rest the lowest point on the floor. */
  hip?: number;
  /** Horizontal hip position, so props can stay put while she moves. */
  dx?: number;
  /** Extra height when the floor is found automatically (a jump, a deck). */
  lift?: number;
  /** Direction from hip to neck. */
  torso: number;
  /** Spine curve, side view only. Positive rounds the back. */
  bend?: number;
  /** Direction from neck to head; defaults to the torso direction. */
  head?: number;
  /** Shortens the torso, for leaning towards the viewer. */
  torsoLen?: number;
  /** Shortens a limb that points at the viewer: upper segment, or [upper, lower]. */
  short?: Partial<Record<"arm0" | "arm1" | "leg0" | "leg1", number | [number, number]>>;
  /** Draws the near arm behind the head, for hands behind the head. */
  armBehind?: boolean;
  arms: [Limb, Limb];
  legs: [Limb, Limb];
  props?: Prop[];
};

export type Point = { x: number; y: number };

export const LEN = {
  torso: 32,
  neck: 2,
  head: 12,
  upper: 16,
  fore: 15,
  thigh: 24,
  shin: 23,
  foot: 7,
} as const;

export const WIDTH = {
  torso: 15,
  torsoFront: 21,
  arm: 6,
  leg: 8,
} as const;

const SHOULDER_AT = 0.85;
const RAD = Math.PI / 180;

export const dir = (angle: number, length = 1): Point => ({
  x: Math.cos(angle * RAD) * length,
  y: Math.sin(angle * RAD) * length,
});
export const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
export const angleOf = (from: Point, to: Point) =>
  Math.atan2(to.y - from.y, to.x - from.x) / RAD;
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export type Segment = { root: Point; mid: Point; end: Point; toe?: Point };

export type Figure = {
  view: "side" | "front";
  torso: number;
  bend: number;
  headAngle: number;
  hip: Point;
  neck: Point;
  head: Point;
  shoulders: [Point, Point];
  arms: [Segment, Segment];
  legs: [Segment, Segment];
};

/** Picks the elbow or knee position. `prefer` scores a candidate; higher wins. */
function solveLimb(
  root: Point,
  spec: Limb,
  upper: number,
  lower: number,
  prefer: (mid: Point) => number,
): { mid: Point; end: Point; lowerAngle: number; foot?: number } {
  if (Array.isArray(spec)) {
    const mid = add(root, dir(spec[0], upper));
    return {
      mid,
      end: add(mid, dir(spec[1], lower)),
      lowerAngle: spec[1],
      foot: spec[2],
    };
  }

  const target = { x: spec.to[0], y: spec.to[1] };
  const base = angleOf(root, target);
  const reach = Math.min(
    Math.max(dist(root, target), Math.abs(upper - lower) + 0.01),
    upper + lower - 0.01,
  );
  const spread =
    Math.acos((upper * upper + reach * reach - lower * lower) / (2 * upper * reach)) /
    RAD;
  const end = add(root, dir(base, reach));
  const candidates = [1, -1].map((sign) => add(root, dir(base + sign * spread, upper)));
  const mid = spec.bend
    ? candidates[spec.bend === 1 ? 0 : 1]
    : prefer(candidates[0]) >= prefer(candidates[1])
      ? candidates[0]
      : candidates[1];
  return { mid, end, lowerAngle: angleOf(mid, end), foot: spec.foot };
}

export function buildFigure(pose: Pose): Figure {
  const front = pose.view === "front";
  const hip = { x: pose.dx ?? 0, y: pose.hip ?? 0 };
  const torsoLength = LEN.torso * (pose.torsoLen ?? 1);
  const neck = add(hip, dir(pose.torso, torsoLength));
  const shoulder = add(hip, dir(pose.torso, torsoLength * SHOULDER_AT));
  const headAngle = pose.head ?? pose.torso;
  const head = add(neck, dir(headAngle, LEN.neck + LEN.head));

  const shoulders: [Point, Point] = front
    ? [add(shoulder, dir(pose.torso + 90, 10)), add(shoulder, dir(pose.torso - 90, 10))]
    : [shoulder, shoulder];
  const hips: [Point, Point] = front
    ? [add(hip, dir(pose.torso + 90, 6)), add(hip, dir(pose.torso - 90, 6))]
    : [hip, hip];

  const facing = dir(pose.torso - 90);
  const lengths = (key: "arm0" | "arm1" | "leg0" | "leg1", upper: number, lower: number) => {
    const factor = pose.short?.[key] ?? 1;
    const [a, b] = Array.isArray(factor) ? factor : [factor, 1];
    return [upper * a, lower * b] as const;
  };
  const outward = (side: number) => dir(pose.torso + (side === 0 ? 90 : -90));
  const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;

  const arms = [0, 1].map((side) => {
    const root = shoulders[side];
    const solved = solveLimb(
      root,
      pose.arms[side],
      ...lengths(side === 0 ? "arm0" : "arm1", LEN.upper, LEN.fore),
      front
        ? (mid) => dot({ x: mid.x - root.x, y: mid.y - root.y }, outward(side))
        : (mid) => -dist(mid, hip),
    );
    return { root, mid: solved.mid, end: solved.end };
  }) as [Segment, Segment];

  const legs = [0, 1].map((side) => {
    const root = hips[side];
    const solved = solveLimb(
      root,
      pose.legs[side],
      ...lengths(side === 0 ? "leg0" : "leg1", LEN.thigh, LEN.shin),
      front
        ? (mid) => dot({ x: mid.x - root.x, y: mid.y - root.y }, outward(side))
        : (mid) => dot({ x: mid.x - root.x, y: mid.y - root.y }, facing),
    );
    const footAngle =
      solved.foot ?? (front ? (side === 0 ? 200 : -20) : solved.lowerAngle + 90);
    const toe = add(solved.end, dir(footAngle, front ? 4 : LEN.foot));
    return { root, mid: solved.mid, end: solved.end, toe };
  }) as [Segment, Segment];

  const figure: Figure = {
    view: front ? "front" : "side",
    torso: pose.torso,
    bend: pose.bend ?? 0,
    headAngle,
    hip,
    neck,
    head,
    shoulders,
    arms,
    legs,
  };

  if (pose.hip === undefined) {
    const shift = (pose.lift ?? 0) - lowestPoint(figure);
    return moveFigure(figure, shift);
  }
  return figure;
}

function lowestPoint(figure: Figure): number {
  const torsoRadius = (figure.view === "front" ? WIDTH.torsoFront : WIDTH.torso) / 2;
  const candidates = [
    figure.hip.y - torsoRadius,
    figure.neck.y - torsoRadius,
    figure.head.y - LEN.head,
  ];
  for (const arm of figure.arms) {
    candidates.push(arm.mid.y - WIDTH.arm / 2, arm.end.y - WIDTH.arm / 2 - 1);
  }
  for (const leg of figure.legs) {
    candidates.push(leg.mid.y - WIDTH.leg / 2, leg.end.y - WIDTH.leg / 2);
    if (leg.toe) candidates.push(leg.toe.y - 3);
  }
  return Math.min(...candidates);
}

function moveFigure(figure: Figure, dy: number): Figure {
  const m = (p: Point): Point => ({ x: p.x, y: p.y + dy });
  const seg = (s: Segment): Segment => ({
    root: m(s.root),
    mid: m(s.mid),
    end: m(s.end),
    toe: s.toe && m(s.toe),
  });
  return {
    ...figure,
    hip: m(figure.hip),
    neck: m(figure.neck),
    head: m(figure.head),
    shoulders: [m(figure.shoulders[0]), m(figure.shoulders[1])],
    arms: [seg(figure.arms[0]), seg(figure.arms[1])],
    legs: [seg(figure.legs[0]), seg(figure.legs[1])],
  };
}

export function jointOf(figure: Figure, joint: Joint): Point {
  switch (joint) {
    case "hip":
      return figure.hip;
    case "neck":
      return figure.neck;
    case "head":
      return figure.head;
    case "sh0":
      return figure.shoulders[0];
    case "sh1":
      return figure.shoulders[1];
    case "e0":
      return figure.arms[0].mid;
    case "e1":
      return figure.arms[1].mid;
    case "h0":
      return figure.arms[0].end;
    case "h1":
      return figure.arms[1].end;
    case "k0":
      return figure.legs[0].mid;
    case "k1":
      return figure.legs[1].mid;
    case "a0":
      return figure.legs[0].end;
    case "a1":
      return figure.legs[1].end;
    case "t0":
      return figure.legs[0].toe ?? figure.legs[0].end;
    case "t1":
      return figure.legs[1].toe ?? figure.legs[1].end;
  }
}
