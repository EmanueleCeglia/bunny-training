import {
  LEN,
  WIDTH,
  add,
  angleOf,
  buildFigure,
  dir,
  jointOf,
  type Figure,
  type Point,
  type Pose,
  type Prop,
} from "@/lib/figure";

const VIEW = { w: 200, maxH: 160, minH: 96, below: 10 };

const C = {
  body: "#ffffff",
  far: "#ffe1ed",
  line: "#f07aa9",
  face: "#452334",
  ear: "#ffadcf",
  nose: "#f85497",
  prop: "#f7ecf1",
  propLine: "#c793ab",
  metal: "#8d6376",
  floor: "#ffd0e3",
  motion: "#ff7db3",
};

export type Layout = { cx: number; scale: number; height: number };

/** One shared framing for both pictures, so the equipment doesn't jump between them. */
export function layoutFor(poses: Pose[]): Layout {
  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = 0;
  for (const pose of poses) {
    const figure = buildFigure(pose);
    const xs = [
      figure.hip.x,
      figure.neck.x,
      figure.head.x - LEN.head,
      figure.head.x + LEN.head,
      ...figure.arms.flatMap((arm) => [arm.mid.x, arm.end.x]),
      ...figure.legs.flatMap((leg) => [leg.mid.x, leg.end.x, leg.toe?.x ?? leg.end.x]),
      ...(pose.props ?? []).flatMap((prop) => propXs(prop, figure)),
    ];
    minX = Math.min(minX, ...xs);
    maxX = Math.max(maxX, ...xs);
    maxY = Math.max(
      maxY,
      figure.head.y + LEN.head + 16,
      ...figure.arms.map((a) => a.end.y + 4),
      ...(pose.props ?? []).map((prop) => propTop(prop)),
    );
  }
  const width = maxX - minX + 16;
  const room = VIEW.maxH - VIEW.below - 4;
  // Lying-down moves are short and wide; let them grow a little to stay legible.
  const scale = Math.min(1.25, (VIEW.w - 12) / width, room / maxY);
  // Floor moves get a shorter frame instead of a tall empty one.
  const height = Math.round(
    Math.min(VIEW.maxH, Math.max(VIEW.minH, maxY * scale + VIEW.below + 12)),
  );
  return { cx: (minX + maxX) / 2, scale, height };
}

function propTop(prop: Prop): number {
  switch (prop.t) {
    case "cable":
      return Math.max(prop.to[1] + 8, 40);
    case "bar":
      return prop.at[1] + 6;
    case "lever":
      return prop.to[1] + 4;
    case "bench":
      return prop.top + (prop.back ? 26 : 0);
    case "treadmill":
      return 78;
    case "elliptical":
      return 74;
    case "stairs":
      return 100;
    default:
      return 0;
  }
}

function propXs(prop: Prop, figure: Figure): number[] {
  switch (prop.t) {
    case "bench":
      return prop.x;
    case "cable":
      return [prop.to[0] + (prop.post ?? 0)];
    case "lever":
      return [prop.to[0]];
    case "bar":
      return [prop.at[0], prop.post];
    case "wall":
      return [prop.x];
    case "treadmill":
      return [figure.hip.x - 32, figure.hip.x + 52];
    case "rower":
      return [figure.hip.x - 26, Math.max(figure.legs[0].end.x, figure.legs[1].end.x) + 28];
    case "elliptical":
      return [figure.hip.x - 30, figure.hip.x + 44];
    case "stairs":
      return [-24, 34];
    default:
      return [];
  }
}

export default function BunnyPose({
  pose,
  layout,
  className,
}: {
  pose: Pose;
  layout?: Layout;
  className?: string;
}) {
  const figure = buildFigure(pose);
  const { cx, scale, height } = layout ?? layoutFor([pose]);
  const floor = height - VIEW.below;
  const X = (x: number) => +(VIEW.w / 2 + (x - cx) * scale).toFixed(1);
  const Y = (y: number) => +(floor - y * scale).toFixed(1);
  const s = (n: number) => +(n * scale).toFixed(2);
  const path = (points: Point[]) =>
    "M" + points.map((p) => `${X(p.x)} ${Y(p.y)}`).join(" L");

  const draw: Draw = { X, Y, s, path, top: floor / scale + 2 };
  const props = pose.props ?? [];
  const layer = (name: PropLayer) =>
    props
      .filter((prop) => propLayer(prop, figure.view) === name)
      .map((prop, index) => (
        <PropShape key={`${name}${index}`} prop={prop} figure={figure} draw={draw} />
      ));

  const side = figure.view === "side";
  const nearArm = (
    <LimbShape points={armPoints(figure, 0)} width={WIDTH.arm} fill={C.body} draw={draw} />
  );

  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${height}`}
      className={className}
      aria-hidden
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line
        x1={8}
        x2={VIEW.w - 8}
        y1={floor + 1.5}
        y2={floor + 1.5}
        stroke={C.floor}
        strokeWidth={2.5}
      />
      {layer("back")}
      {side ? (
        <>
          <LimbShape points={legPoints(figure, 1)} width={WIDTH.leg} fill={C.far} draw={draw} />
          <LimbShape points={armPoints(figure, 1)} width={WIDTH.arm} fill={C.far} draw={draw} />
          {layer("mid")}
          <Tail figure={figure} draw={draw} />
          <Torso figure={figure} draw={draw} />
          <LimbShape points={legPoints(figure, 0)} width={WIDTH.leg} fill={C.body} draw={draw} />
          {pose.armBehind && nearArm}
          <Head figure={figure} draw={draw} />
          {!pose.armBehind && nearArm}
        </>
      ) : (
        <>
          <LimbShape points={legPoints(figure, 1)} width={WIDTH.leg} fill={C.body} draw={draw} />
          <LimbShape points={legPoints(figure, 0)} width={WIDTH.leg} fill={C.body} draw={draw} />
          {layer("mid")}
          <Torso figure={figure} draw={draw} />
          <LimbShape points={armPoints(figure, 0)} width={WIDTH.arm} fill={C.body} draw={draw} />
          <LimbShape points={armPoints(figure, 1)} width={WIDTH.arm} fill={C.body} draw={draw} />
          <Head figure={figure} draw={draw} />
        </>
      )}
      {layer("front")}
    </svg>
  );
}

type Draw = {
  X: (x: number) => number;
  Y: (y: number) => number;
  s: (n: number) => number;
  path: (points: Point[]) => string;
  /** World height of the frame's top edge. */
  top: number;
};

function armPoints(figure: Figure, side: 0 | 1): Point[] {
  const arm = figure.arms[side];
  return [arm.root, arm.mid, arm.end];
}

function legPoints(figure: Figure, side: 0 | 1): Point[] {
  const leg = figure.legs[side];
  return [leg.root, leg.mid, leg.end, ...(leg.toe ? [leg.toe] : [])];
}

function LimbShape({
  points,
  width,
  fill,
  draw,
}: {
  points: Point[];
  width: number;
  fill: string;
  draw: Draw;
}) {
  const d = draw.path(points);
  return (
    <g fill="none">
      <path d={d} stroke={C.line} strokeWidth={draw.s(width + 2.6)} />
      <path d={d} stroke={fill} strokeWidth={draw.s(width)} />
    </g>
  );
}

function Torso({ figure, draw }: { figure: Figure; draw: Draw }) {
  const { X, Y, s } = draw;
  const width = figure.view === "front" ? WIDTH.torsoFront : WIDTH.torso;
  const middle = {
    x: (figure.hip.x + figure.neck.x) / 2,
    y: (figure.hip.y + figure.neck.y) / 2,
  };
  const control = add(middle, dir(figure.torso + 90, figure.bend * 2));
  const d = `M${X(figure.hip.x)} ${Y(figure.hip.y)} Q${X(control.x)} ${Y(control.y)} ${X(figure.neck.x)} ${Y(figure.neck.y)}`;
  return (
    <g fill="none">
      <path d={d} stroke={C.line} strokeWidth={s(width + 2.6)} />
      <path d={d} stroke={C.body} strokeWidth={s(width)} />
    </g>
  );
}

function Tail({ figure, draw }: { figure: Figure; draw: Draw }) {
  const tail = add(figure.hip, dir(figure.torso + 90, 7.5));
  return (
    <circle
      cx={draw.X(tail.x)}
      cy={draw.Y(tail.y)}
      r={draw.s(5)}
      fill={C.body}
      stroke={C.line}
      strokeWidth={draw.s(1.3)}
    />
  );
}

function Ear({
  base,
  angle,
  fill,
  draw,
}: {
  base: Point;
  angle: number;
  fill: string;
  draw: Draw;
}) {
  const { X, Y, s } = draw;
  const center = add(base, dir(angle, 8));
  const inner = add(base, dir(angle, 9.5));
  const rotate = 90 - angle;
  return (
    <g>
      <ellipse
        cx={X(center.x)}
        cy={Y(center.y)}
        rx={s(4.4)}
        ry={s(10)}
        fill={fill}
        stroke={C.line}
        strokeWidth={s(1.3)}
        transform={`rotate(${rotate} ${X(center.x)} ${Y(center.y)})`}
      />
      <ellipse
        cx={X(inner.x)}
        cy={Y(inner.y)}
        rx={s(2)}
        ry={s(6.5)}
        fill={C.ear}
        transform={`rotate(${rotate} ${X(inner.x)} ${Y(inner.y)})`}
      />
    </g>
  );
}

function Head({ figure, draw }: { figure: Figure; draw: Draw }) {
  const { X, Y, s } = draw;
  const head = figure.head;
  const up = figure.headAngle;
  const at = (angle: number, length: number) => add(head, dir(angle, length));
  const dot = (p: Point, r: number, fill: string) => (
    <circle cx={X(p.x)} cy={Y(p.y)} r={s(r)} fill={fill} />
  );
  const blush = (p: Point) => (
    <ellipse cx={X(p.x)} cy={Y(p.y)} rx={s(2.6)} ry={s(1.5)} fill={C.ear} opacity={0.8} />
  );

  if (figure.view === "side") {
    const forward = up - 90;
    const face = (ahead: number, above: number) =>
      add(add(head, dir(forward, ahead)), dir(up, above));
    return (
      <g>
        <Ear base={at(up + 4, 9)} angle={up + 12} fill={C.far} draw={draw} />
        <Ear base={at(up + 16, 9)} angle={up + 28} fill={C.body} draw={draw} />
        <circle
          cx={X(head.x)}
          cy={Y(head.y)}
          r={s(LEN.head)}
          fill={C.body}
          stroke={C.line}
          strokeWidth={s(1.3)}
        />
        {dot(face(5.5, 2.5), 1.7, C.face)}
        {dot(face(11.2, -1.5), 1.6, C.nose)}
        {blush(face(5, -3.6))}
      </g>
    );
  }

  const right = up - 90;
  const face = (across: number, above: number) =>
    add(add(head, dir(right, across)), dir(up, above));
  return (
    <g>
      <Ear base={at(up + 28, 9)} angle={up + 12} fill={C.body} draw={draw} />
      <Ear base={at(up - 28, 9)} angle={up - 12} fill={C.body} draw={draw} />
      <circle
        cx={X(head.x)}
        cy={Y(head.y)}
        r={s(LEN.head)}
        fill={C.body}
        stroke={C.line}
        strokeWidth={s(1.3)}
      />
      {dot(face(-4.5, 1.5), 1.7, C.face)}
      {dot(face(4.5, 1.5), 1.7, C.face)}
      {dot(face(0, -2.5), 1.5, C.nose)}
      {blush(face(-7.4, -2.8))}
      {blush(face(7.4, -2.8))}
    </g>
  );
}

type PropLayer = "back" | "mid" | "front";

function propLayer(prop: Prop, view: "side" | "front"): PropLayer {
  switch (prop.t) {
    case "db":
      return prop.at.endsWith("1") && view === "side" ? "mid" : "front";
    case "pad":
    case "arc":
    case "lever":
    case "grip":
      return "front";
    case "cable":
      return prop.at.endsWith("1") && view === "side" ? "mid" : "front";
    default:
      return "back";
  }
}

function PropShape({
  prop,
  figure,
  draw,
}: {
  prop: Prop;
  figure: Figure;
  draw: Draw;
}) {
  const { X, Y, s, path } = draw;
  const box = { fill: C.prop, stroke: C.propLine, strokeWidth: s(1.3) };
  const rod = (from: Point, to: Point, width = 2.6, color = C.propLine) => (
    <path d={path([from, to])} stroke={color} strokeWidth={s(width)} fill="none" />
  );
  const rect = (x0: number, y0: number, x1: number, y1: number, radius = 1.5) => (
    <rect
      x={X(Math.min(x0, x1))}
      y={Y(Math.max(y0, y1))}
      width={s(Math.abs(x1 - x0))}
      height={s(Math.abs(y1 - y0))}
      rx={s(radius)}
      {...box}
    />
  );
  const capsule = (from: Point, to: Point, width: number) => (
    <g fill="none">
      <path d={path([from, to])} stroke={C.propLine} strokeWidth={s(width + 2.4)} />
      <path d={path([from, to])} stroke={C.prop} strokeWidth={s(width)} />
    </g>
  );
  const circle = (p: Point, r: number, fill = C.prop) => (
    <circle cx={X(p.x)} cy={Y(p.y)} r={s(r)} fill={fill} stroke={C.propLine} strokeWidth={s(1.3)} />
  );
  const pt = (x: number, y: number): Point => ({ x, y });

  switch (prop.t) {
    case "db": {
      const center = add(jointOf(figure, prop.at), pt(0, prop.dy ?? 0));
      const angle = prop.angle ?? 0;
      const plates = [-6.5, 6.5].map((offset) => add(center, dir(angle, offset)));
      return (
        <g>
          {rod(add(center, dir(angle, -7.5)), add(center, dir(angle, 7.5)), 2.2, C.metal)}
          {plates.map((plate, index) => (
            <path
              key={index}
              d={path([add(plate, dir(angle + 90, -4.5)), add(plate, dir(angle + 90, 4.5))])}
              stroke={C.metal}
              strokeWidth={s(4)}
              fill="none"
            />
          ))}
        </g>
      );
    }

    case "bench": {
      const [x0, x1] = prop.x;
      return (
        <g>
          {rod(pt(x0 + 4, prop.top - 4), pt(x0 + 4, 0))}
          {rod(pt(x1 - 4, prop.top - 4), pt(x1 - 4, 0))}
          {prop.back && capsule(
            pt(prop.back === "start" ? x0 + 2 : x1 - 2, prop.top),
            pt(prop.back === "start" ? x0 + 2 : x1 - 2, prop.top + 26),
            4,
          )}
          {rect(x0, prop.top, x1, prop.top - 5)}
        </g>
      );
    }

    case "seat": {
      const front = figure.view === "front";
      const top = figure.hip.y - (front ? WIDTH.torsoFront : WIDTH.torso) / 2;
      const center = figure.hip.x - (front ? 0 : 2);
      const half = (prop.width ?? (front ? 34 : 24)) / 2;
      const backrest = front
        ? capsule(pt(center, top + 6), add(figure.neck, pt(0, -6)), 26)
        : capsule(
            add(add(figure.hip, dir(figure.torso + 90, 11)), dir(figure.torso, -2)),
            add(add(figure.hip, dir(figure.torso + 90, 11)), dir(figure.torso, 30)),
            5,
          );
      return (
        <g>
          {rod(pt(center, top - 5), pt(center, 0), 3)}
          {rod(pt(center - 11, 0.5), pt(center + 11, 0.5), 3)}
          {prop.back && backrest}
          {rect(center - half, top, center + half, top - 5)}
        </g>
      );
    }

    case "cable": {
      const hand = jointOf(figure, prop.at);
      const pulley = pt(prop.to[0], prop.to[1]);
      const column = prop.post === undefined ? null : prop.to[0] + prop.post;
      return (
        <g>
          {column !== null && (
            <>
              {rect(column - 3, 0, column + 3, Math.max(pulley.y + 8, 40), 2)}
              {rod(pulley, pt(column, pulley.y), 2)}
            </>
          )}
          {rod(hand, pulley, 1.2)}
          {circle(pulley, 3)}
          {circle(hand, 2.3, C.metal)}
        </g>
      );
    }

    case "lever": {
      const hand = jointOf(figure, prop.at);
      const pivot = pt(prop.to[0], prop.to[1]);
      return (
        <g>
          {rod(hand, pivot, 3.2)}
          {circle(pivot, 3.2)}
          {circle(hand, 2.6, C.metal)}
        </g>
      );
    }

    case "grip": {
      const hand = jointOf(figure, prop.at);
      return (
        <g>
          {rod(add(hand, pt(0, -5)), add(hand, pt(0, 5)), 2.6, C.metal)}
          {circle(hand, 2.6, C.metal)}
        </g>
      );
    }

    case "pad": {
      const joint = jointOf(figure, prop.at);
      const legIndex = prop.at.endsWith("1") ? 1 : 0;
      const leg = figure.legs[legIndex];
      const shin = angleOf(leg.mid, leg.end);
      let center = joint;
      if (prop.side === "front") center = add(add(joint, dir(shin, -4)), dir(shin + 90, 7.5));
      if (prop.side === "back") center = add(add(joint, dir(shin, -4)), dir(shin - 90, 7.5));
      if (prop.side === "top") center = add(joint, pt(-3, 8));
      if (prop.side === "under") center = add(joint, pt(0, -8));
      center = add(center, pt(prop.dx ?? 0, 0));
      return (
        <g>
          {prop.post && rod(center, pt(center.x, 0), 3)}
          {circle(center, 4.6)}
        </g>
      );
    }

    case "bar": {
      const bar = pt(prop.at[0], prop.at[1]);
      return (
        <g>
          {rect(prop.post - 2.5, 0, prop.post + 2.5, bar.y + 6, 2)}
          {rod(bar, pt(prop.post, bar.y + 4), 3)}
          {circle(bar, 2.6, C.metal)}
        </g>
      );
    }

    case "wall":
      return rect(prop.x - 3, prop.from ?? 0, prop.x + 3, draw.top, 1);

    case "mat": {
      const xs = [
        figure.hip.x,
        figure.head.x - LEN.head,
        figure.head.x + LEN.head,
        ...figure.legs.flatMap((leg) => [leg.end.x, leg.toe?.x ?? leg.end.x]),
        ...figure.arms.map((arm) => arm.end.x),
      ];
      const x0 = Math.min(...xs) - 5;
      const x1 = Math.max(...xs) + 5;
      return (
        <rect
          x={X(x0)}
          y={Y(2.5)}
          width={s(x1 - x0)}
          height={s(3)}
          rx={s(1.5)}
          fill={C.floor}
        />
      );
    }

    case "plate": {
      const leg = figure.legs[prop.leg];
      const shin = angleOf(leg.mid, leg.end);
      const center = add(leg.end, dir(shin, 6));
      return (
        <g>
          {rod(center, pt(center.x, 0), 3)}
          {capsule(add(center, dir(shin + 90, -13)), add(center, dir(shin + 90, 13)), 3.5)}
        </g>
      );
    }

    case "treadmill": {
      const x0 = figure.hip.x - 32;
      const x1 = figure.hip.x + 40;
      return (
        <g>
          {rod(pt(x1 - 2, 5), pt(x1 + 6, 72), 3.5)}
          {rod(pt(x1 + 4, 62), pt(x1 - 14, 62), 2.5)}
          {rect(x1, 70, x1 + 12, 78, 2)}
          {rect(x0, 6, x1, 0, 3)}
        </g>
      );
    }

    case "bike": {
      const [a0, a1] = [figure.legs[0].end, figure.legs[1].end];
      const crank = pt((a0.x + a1.x) / 2, (a0.y + a1.y) / 2);
      const seat = add(figure.hip, pt(-1, -WIDTH.torso / 2));
      const grip = add(figure.arms[0].end, pt(1, -3));
      return (
        <g>
          {rod(pt(crank.x - 24, 0.5), pt(crank.x + 30, 0.5), 3)}
          {rod(crank, pt(crank.x - 14, 0.5), 3)}
          {rod(crank, pt(crank.x + 20, 0.5), 3)}
          {rod(seat, crank, 3)}
          {rod(crank, pt(grip.x - 6, grip.y - 8), 3)}
          {rod(pt(grip.x - 6, grip.y - 8), grip, 3)}
          <circle
            cx={X(crank.x)}
            cy={Y(crank.y)}
            r={s(9)}
            fill="none"
            stroke={C.propLine}
            strokeWidth={s(1.5)}
          />
          {rect(seat.x - 8, seat.y, seat.x + 7, seat.y - 3.5, 1.5)}
        </g>
      );
    }

    case "rower": {
      const feet = Math.max(figure.legs[0].end.x, figure.legs[1].end.x);
      const wheel = pt(feet + 18, 16);
      const hand = figure.arms[0].end;
      const seatTop = figure.hip.y - WIDTH.torso / 2;
      return (
        <g>
          {rod(pt(figure.hip.x - 26, 5), pt(wheel.x, 5), 3)}
          {rod(pt(figure.hip.x - 24, 5), pt(figure.hip.x - 24, 0), 3)}
          {rod(pt(wheel.x, 5), pt(wheel.x + 6, 0), 3)}
          {rod(pt(figure.hip.x, seatTop - 3), pt(figure.hip.x, 5), 2.5)}
          {rect(figure.hip.x - 9, seatTop, figure.hip.x + 8, seatTop - 3, 1.5)}
          {rod(hand, wheel, 1.2)}
          {circle(wheel, 9)}
          {circle(hand, 2.3, C.metal)}
        </g>
      );
    }

    case "elliptical": {
      const pivot = pt(figure.hip.x + 38, 34);
      return (
        <g>
          {rod(pt(figure.hip.x - 30, 1), pt(figure.hip.x + 44, 1), 3)}
          {rod(pt(figure.hip.x + 44, 1), pt(figure.hip.x + 40, 68), 3.5)}
          {rect(figure.hip.x + 36, 66, figure.hip.x + 48, 74, 2)}
          {figure.legs.map((leg, index) => (
            <g key={index}>
              {rod(pt(leg.end.x - 9, leg.end.y - 5), pt(leg.end.x + 8, leg.end.y - 5), 3)}
              {rod(pt(leg.end.x, leg.end.y - 5), pivot, 2)}
            </g>
          ))}
          {figure.arms.map((arm, index) => (
            <g key={index}>{rod(arm.end, pivot, 2.5)}</g>
          ))}
          {circle(pivot, 3)}
        </g>
      );
    }

    case "stairs":
      return (
        <g>
          {rod(pt(30, 0), pt(30, 100), 4)}
          {rod(pt(30, 94), pt(10, 88), 2.5)}
          {[0, 1, 2].map((step) =>
            <g key={step}>{rect(-24 + 16 * step, 6 + 12 * step, -8 + 16 * step, 0, 1)}</g>,
          )}
        </g>
      );

    case "arc": {
      const center = jointOf(figure, prop.at);
      const steps = 16;
      const points = Array.from({ length: steps + 1 }, (_, i) =>
        add(center, dir(prop.from + ((prop.to - prop.from) * i) / steps, prop.r)),
      );
      const tip = points[points.length - 1];
      const heading = prop.to + (prop.to > prop.from ? 90 : -90);
      const wing = (offset: number) => add(tip, dir(heading + 180 + offset, 4));
      return (
        <g fill="none" stroke={C.motion} strokeWidth={s(1.6)}>
          <path d={path(points)} strokeDasharray={`${s(3)} ${s(2.5)}`} />
          <path d={path([wing(-35), tip, wing(35)])} />
        </g>
      );
    }
  }
}
