import AppHeader from "@/components/AppHeader";
import LevelBar from "@/components/LevelBar";
import { todayISO } from "@/lib/date";
import { computeProgress } from "@/lib/progress";
import { progressRows } from "@/lib/workouts";

export const dynamic = "force-dynamic";

export default async function TrophiesPage() {
  const progress = computeProgress(await progressRows(), todayISO());
  const earned = progress.badges.filter((badge) => badge.earned).length;
  const hours = Math.floor(progress.minutes / 60);
  const stats = [
    { value: progress.workouts, label: "workouts" },
    {
      value: hours > 0 ? `${hours}h ${progress.minutes % 60}m` : `${progress.minutes}m`,
      label: "trained",
    },
    {
      value: progress.streakWeeks,
      label: progress.streakWeeks === 1 ? "week in a row" : "weeks in a row",
    },
  ];

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader />
      <h1 className="mb-5 text-3xl font-bold text-bunny-700">Your trophies</h1>

      <section className="card text-center">
        <div className="text-5xl">🐰</div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-bunny-400">
          Level {progress.level.number}
        </p>
        <h2 className="text-2xl font-bold text-bunny-700">{progress.level.name}</h2>
        <div className="mt-4 text-left">
          <LevelBar level={progress.level} carrots={progress.carrots} />
        </div>
      </section>

      <dl className="my-4 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card !p-3 text-center">
            <dd className="text-xl font-bold text-bunny-700">{stat.value}</dd>
            <dt className="text-xs text-ink-soft">{stat.label}</dt>
          </div>
        ))}
      </dl>

      <h2 className="mb-1 font-bold text-bunny-700">
        Badges
        <span className="ml-2 text-xs font-semibold text-bunny-400">
          {earned} of {progress.badges.length}
        </span>
      </h2>
      <p className="mb-3 text-xs text-ink-soft">
        Every finished workout earns carrots: 10 for showing up, one for each
        exercise you tick, and a bonus for a full basket of three in a week.
      </p>
      <ul className="grid grid-cols-2 gap-3">
        {progress.badges.map((badge) => (
          <li
            key={badge.id}
            className={`card !p-4 text-center ${badge.earned ? "" : "opacity-55"}`}
          >
            <div className={`text-3xl ${badge.earned ? "" : "grayscale"}`}>
              {badge.emoji}
            </div>
            <p className="mt-1 text-sm font-bold text-bunny-700">{badge.name}</p>
            <p className="text-xs text-ink-soft">
              {badge.earned ? "Earned" : badge.how}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
