"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Focus, TrainingLocation } from "@/lib/types";

const DURATIONS = [20, 30, 45, 60];
const FOCUSES: { value: Focus; label: string }[] = [
  { value: "full_body", label: "Full body" },
  { value: "upper", label: "Upper" },
  { value: "lower", label: "Lower" },
];

export default function NewWorkoutForm() {
  const router = useRouter();
  const [location, setLocation] = useState<TrainingLocation>("gym");
  const [durationMin, setDurationMin] = useState(45);
  const [focus, setFocus] = useState<Focus>("full_body");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, durationMin, focus, difficulty: 3 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/workout/${data.id}`);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="card flex flex-col gap-5">
      <Group label="Where are you training?">
        <Chip on={location === "gym"} onClick={() => setLocation("gym")}>
          🏋️ Gym
        </Chip>
        <Chip on={location === "home"} onClick={() => setLocation("home")}>
          🏠 Home
        </Chip>
      </Group>

      <Group label="How much time?">
        {DURATIONS.map((minutes) => (
          <Chip
            key={minutes}
            on={durationMin === minutes}
            onClick={() => setDurationMin(minutes)}
          >
            {minutes}
            <span className="text-xs"> min</span>
          </Chip>
        ))}
      </Group>

      <Group label="What are we working on?">
        {FOCUSES.map((option) => (
          <Chip
            key={option.value}
            on={focus === option.value}
            onClick={() => setFocus(option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </Group>

      {error && (
        <p className="text-center text-sm font-semibold text-bunny-600">{error}</p>
      )}

      <button className="btn-primary" onClick={generate} disabled={busy}>
        {busy ? "Writing your workout…" : "Make today's workout ✨"}
      </button>
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink-soft">{label}</p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip ${on ? "chip-on" : ""}`}
      aria-pressed={on}
    >
      {children}
    </button>
  );
}
