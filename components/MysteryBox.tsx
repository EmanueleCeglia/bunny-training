"use client";

import { useState } from "react";
import FeelPicker from "./FeelPicker";
import LevelBar from "./LevelBar";
import type { Rewards } from "@/lib/progress";

const CONFETTI = ["🥕", "💖", "✨", "🌸", "🥕", "💗"];

export default function MysteryBox({
  workoutId,
  phrase,
  rewards,
  onClose,
}: {
  workoutId: string;
  phrase: string;
  rewards: Rewards;
  onClose: () => void;
}) {
  const [opened, setOpened] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 overflow-y-auto bg-bunny-900/45 px-6 py-8 backdrop-blur-sm">
      {opened ? (
        <>
          <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
            {Array.from({ length: 18 }, (_, index) => (
              <span
                key={index}
                className="animate-fall absolute -top-10 text-2xl"
                style={{
                  left: `${(index * 53) % 100}%`,
                  animationDelay: `${(index % 6) * 0.15}s`,
                  animationDuration: `${2.4 + (index % 5) * 0.35}s`,
                }}
              >
                {CONFETTI[index % CONFETTI.length]}
              </span>
            ))}
          </div>

          <div className="card animate-pop relative my-auto flex w-full max-w-sm flex-col gap-5 text-center">
            <div>
              <div className="text-5xl">💝</div>
              <p className="mt-3 text-xl font-bold leading-snug text-bunny-700">
                {phrase}
              </p>
            </div>

            <div className="rounded-3xl bg-bunny-50 p-4">
              <p className="text-2xl font-bold text-bunny-600">
                +{rewards.carrots} 🥕
              </p>
              {rewards.fullBasket && (
                <p className="mt-1 text-sm font-semibold text-bunny-600">
                  🧺 Full basket this week
                </p>
              )}
              {rewards.levelUp && (
                <p className="mt-2 text-sm font-bold text-bunny-700">
                  Level up! You are now a {rewards.level.name} 🎉
                </p>
              )}
              <div className="mt-3">
                <LevelBar level={rewards.level} carrots={rewards.total} />
              </div>
            </div>

            {rewards.badges.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-ink-soft">
                  {rewards.badges.length === 1 ? "New badge" : "New badges"}
                </p>
                <ul className="flex flex-wrap justify-center gap-2">
                  {rewards.badges.map((badge) => (
                    <li
                      key={badge.id}
                      className="animate-pop rounded-full border border-bunny-200 bg-white px-3 py-1.5 text-sm font-bold text-bunny-700"
                    >
                      {badge.emoji} {badge.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <FeelPicker workoutId={workoutId} initial={null} />

            <button className="btn-primary" onClick={onClose}>
              Thank you 🐰
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-center text-lg font-bold text-white drop-shadow">
            Workout finished!
            <br />
            Tap to open your mystery box.
          </p>
          <button
            type="button"
            onClick={() => setOpened(true)}
            aria-label="Open your mystery box"
            className="animate-wiggle text-[7rem] leading-none"
          >
            🎁
          </button>
        </>
      )}
    </div>
  );
}
