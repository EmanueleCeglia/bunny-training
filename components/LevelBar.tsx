import type { Level } from "@/lib/progress";

/** How far she is through her current level, in carrots. */
export default function LevelBar({
  level,
  carrots,
}: {
  level: Level;
  carrots: number;
}) {
  const share =
    level.next === null
      ? 1
      : (carrots - level.floor) / (level.next - level.floor);

  return (
    <div>
      <div className="h-2.5 overflow-hidden rounded-full bg-bunny-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-bunny-300 to-bunny-500 transition-all duration-700"
          style={{ width: `${Math.max(4, share * 100)}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-ink-soft">
        {level.next === null
          ? `${carrots} 🥕 · top level reached`
          : `${carrots} / ${level.next} 🥕 to ${level.nextName}`}
      </p>
    </div>
  );
}
