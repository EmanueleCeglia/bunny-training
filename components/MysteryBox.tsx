"use client";

import { useState } from "react";

export default function MysteryBox({
  phrase,
  onClose,
}: {
  phrase: string;
  onClose: () => void;
}) {
  const [opened, setOpened] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-bunny-900/45 px-6 backdrop-blur-sm">
      {opened ? (
        <div className="card animate-pop w-full max-w-sm text-center">
          <div className="text-5xl">💝</div>
          <p className="mt-4 text-xl font-bold leading-snug text-bunny-700">
            {phrase}
          </p>
          <button className="btn-primary mt-6" onClick={onClose}>
            Thank you 🐰
          </button>
        </div>
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
