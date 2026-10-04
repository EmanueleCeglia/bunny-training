import BunnyPose, { layoutFor } from "./BunnyPose";
import { catalogByName } from "@/lib/catalog";
import { MOVES } from "@/lib/moves";

/** The bunny showing where a move starts and where it ends. */
export default function MoveDemo({ name }: { name: string }) {
  const id = catalogByName(name)?.id;
  const pair = id ? MOVES[id] : undefined;
  if (!pair) return null;

  const layout = layoutFor(pair);
  return (
    <div
      role="img"
      aria-label={`${name}: how to start and how to finish`}
      className="grid grid-cols-2 gap-2"
    >
      {pair.map((pose, index) => (
        <div key={index} className="relative rounded-2xl bg-bunny-50">
          <BunnyPose pose={pose} layout={layout} className="block h-auto w-full" />
          <span className="absolute left-2.5 top-1.5 text-xs font-bold text-bunny-300">
            {index + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
