"use client";

import { useState } from "react";
import type { Feel } from "@/lib/types";

const OPTIONS: { value: Feel; emoji: string; label: string; reply: string }[] = [
  {
    value: "easy",
    emoji: "😌",
    label: "Too easy",
    reply: "Noted. Your next one starts a notch harder.",
  },
  {
    value: "right",
    emoji: "😊",
    label: "Just right",
    reply: "Perfect. Your next one stays right here.",
  },
  {
    value: "hard",
    emoji: "🥵",
    label: "Too hard",
    reply: "Got it. Your next one starts a notch gentler.",
  },
];

/** One tap after a session; it sets where the next one starts. */
export default function FeelPicker({
  workoutId,
  initial,
}: {
  workoutId: string;
  initial: Feel | null;
}) {
  const [feel, setFeel] = useState(initial);

  async function choose(value: Feel) {
    const before = feel;
    setFeel(value);
    const response = await fetch(`/api/workouts/${workoutId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feel: value }),
    });
    // The reply promises a change to her next session, so it must not show
    // unless the answer was really saved.
    if (!response.ok) setFeel(before);
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink-soft">How did it feel?</p>
      <div className="flex gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => choose(option.value)}
            aria-pressed={feel === option.value}
            className={`chip !px-1 !py-2 ${feel === option.value ? "chip-on" : ""}`}
          >
            <span className="block text-xl">{option.emoji}</span>
            <span className="block text-xs">{option.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 min-h-4 text-xs text-bunny-500" aria-live="polite">
        {OPTIONS.find((option) => option.value === feel)?.reply}
      </p>
    </div>
  );
}
