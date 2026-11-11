import Link from "next/link";
import LevelBar from "./LevelBar";
import { WEEKLY_GOAL, type Progress } from "@/lib/progress";

/** Her level, this week's basket and her streak, at a glance. */
export default function ProgressCard({ progress }: { progress: Progress }) {
  const extra = progress.thisWeek - WEEKLY_GOAL;

  return (
    <Link href="/trophies" className="card mb-5 block !p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-bold text-bunny-700">
          {progress.level.name}
          <span className="ml-2 text-xs font-semibold text-bunny-400">
            Level {progress.level.number}
          </span>
        </p>
        {progress.streakWeeks > 0 && (
          <p className="shrink-0 text-sm font-bold text-bunny-600">
            🔥 {progress.streakWeeks}{" "}
            {progress.streakWeeks === 1 ? "week" : "weeks"}
          </p>
        )}
      </div>

      <div className="mt-2">
        <LevelBar level={progress.level} carrots={progress.carrots} />
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-bunny-100 pt-3">
        <span className="text-xs font-semibold text-ink-soft">This week</span>
        <span
          className="flex gap-1 text-lg leading-none"
          aria-label={`${progress.thisWeek} of ${WEEKLY_GOAL} workouts this week`}
        >
          {Array.from({ length: WEEKLY_GOAL }, (_, index) => (
            <span
              key={index}
              className={index < progress.thisWeek ? "" : "opacity-20 grayscale"}
            >
              🥕
            </span>
          ))}
        </span>
        <span className="text-xs text-ink-soft">
          {progress.thisWeek >= WEEKLY_GOAL
            ? `Basket full${extra > 0 ? `, plus ${extra}` : ""} 🧺`
            : progress.thisWeek === 0
              ? "Your basket is waiting"
              : `${WEEKLY_GOAL - progress.thisWeek} to fill the basket`}
        </span>
      </div>
    </Link>
  );
}
