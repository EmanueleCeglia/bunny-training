"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const PASSCODE_LENGTH = 6;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function LockPage() {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function submit(passcode: string) {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });

    if (!response.ok) {
      const { error: message } = await response.json();
      setError(message ?? "Something went wrong");
      setDigits("");
      return;
    }
    startTransition(() => {
      router.replace("/");
      router.refresh();
    });
  }

  function press(key: string) {
    if (digits.length >= PASSCODE_LENGTH || pending) return;
    setError(null);
    const next = digits + key;
    setDigits(next);
    if (next.length === PASSCODE_LENGTH) void submit(next);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8">
      <div className="text-center">
        <div className="text-6xl">🐰</div>
        <h1 className="mt-3 text-3xl font-bold text-bunny-700">
          Bunny Training
        </h1>
        <p className="mt-1 text-sm text-ink-soft">Enter your secret code</p>
      </div>

      <div className="flex gap-3" aria-live="polite">
        {Array.from({ length: PASSCODE_LENGTH }).map((_, index) => (
          <span
            key={index}
            className={`size-3.5 rounded-full transition ${
              index < digits.length ? "scale-110 bg-bunny-500" : "bg-bunny-200"
            }`}
          />
        ))}
      </div>

      <p className="h-5 text-sm font-semibold text-bunny-600">{error}</p>

      <div className="grid w-full max-w-[17rem] grid-cols-3 gap-3">
        {KEYS.map((key) => (
          <KeypadButton key={key} onClick={() => press(key)} label={key} />
        ))}
        <span />
        <KeypadButton onClick={() => press("0")} label="0" />
        <KeypadButton
          onClick={() => {
            setError(null);
            setDigits((current) => current.slice(0, -1));
          }}
          label="⌫"
        />
      </div>
    </main>
  );
}

function KeypadButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="aspect-square rounded-full border border-bunny-100 bg-white/85 text-2xl font-semibold text-bunny-700 shadow-[0_6px_16px_-10px_rgba(226,53,120,0.6)] transition active:scale-90 active:bg-bunny-100"
    >
      {label}
    </button>
  );
}
