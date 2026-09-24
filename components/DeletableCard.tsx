"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import CoachSpinner from "./CoachSpinner";

const HOLD_MS = 550;
const MOVE_TOLERANCE_PX = 10;

export default function DeletableCard({
  workoutId,
  children,
}: {
  workoutId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const timer = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const longPressed = useRef(false);

  function clearTimer() {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  function onPointerDown(event: React.PointerEvent) {
    longPressed.current = false;
    origin.current = { x: event.clientX, y: event.clientY };
    timer.current = window.setTimeout(() => {
      longPressed.current = true;
      navigator.vibrate?.(25);
      setConfirming(true);
    }, HOLD_MS);
  }

  // A hold that turns into a scroll is a scroll, not a delete.
  function onPointerMove(event: React.PointerEvent) {
    const moved =
      Math.abs(event.clientX - origin.current.x) > MOVE_TOLERANCE_PX ||
      Math.abs(event.clientY - origin.current.y) > MOVE_TOLERANCE_PX;
    if (moved) clearTimer();
  }

  async function remove() {
    setDeleting(true);
    await fetch(`/api/workouts/${workoutId}`, { method: "DELETE" });
    setConfirming(false);
    setDeleting(false);
    router.refresh();
  }

  return (
    <div
      className="relative touch-pan-y select-none [-webkit-touch-callout:none]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onPointerLeave={clearTimer}
      onContextMenu={(event) => event.preventDefault()}
      onClickCapture={(event) => {
        if (longPressed.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {children}

      {confirming && (
        <div className="animate-pop absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[var(--radius-bunny)] border border-bunny-200 bg-bunny-50">
          <p className="font-bold text-bunny-700">Delete this workout?</p>
          <div className="flex gap-2">
            <button
              className="btn-soft"
              disabled={deleting}
              onClick={() => setConfirming(false)}
            >
              Keep it
            </button>
            <button
              className="rounded-full bg-bunny-500 px-5 py-2.5 text-sm font-bold text-white transition active:scale-[0.97] disabled:opacity-50"
              disabled={deleting}
              onClick={remove}
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <CoachSpinner size={18} />
                  Deleting…
                </span>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
