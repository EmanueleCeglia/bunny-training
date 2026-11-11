# Bunny Training 🐰

A private daily-workout app for one person. Pick gym or home, how long you have
and what you want to work on; an AI trainer writes the session, you tick the
exercises off, and finishing one unlocks a mystery box.

## Stack

- Next.js 16 (App Router) + Tailwind 4
- Supabase Postgres (free tier)
- OpenAI for generating and revising workouts
- Deployed on Vercel

## Setup

1. **Database.** In the Supabase SQL editor run `supabase/schema.sql`, then
   `supabase/seed-phrases.sql`. On a database that already exists, run any
   newer files in `supabase/migrations/` instead.
2. **Environment.** Copy `.env.example` to `.env.local` and fill it in.
   `SUPABASE_SERVICE_ROLE_KEY` is under Project Settings → API.
3. **Run it.**
   ```
   npm install
   npm run dev
   ```

## How access works

There are no user accounts. `APP_PASSCODE` unlocks the app and the server sets
a signed, httpOnly cookie that lasts 90 days.

Supabase is reached **only** from server code using the service-role key. Every
table has row level security enabled with no policies, so the database is
unreachable from the browser even if a key leaked. Never import `lib/db.ts`
from a Client Component.

## The exercise catalog

The trainer never invents exercises. It picks from the fixed list in
`lib/catalog.ts`, which is filtered by place and focus before every request,
and the structured-output schema only accepts ids from that filtered list.
At home that means bodyweight plus one dumbbell of up to 10 kg.

To add or remove a move, edit the list. Give it a stable `id`, a `region`, the
`places` it works in and a `level` from 1 to 3. Don't rename an existing
entry's `name`: revisions and swaps match saved exercises by name. Strength
moves also take a `pattern` (push, pull, squat, hinge, glute, arms), which is
how a session is kept balanced and how a swap finds a like-for-like move. Mark
a move `sides` if it is done one side at a time and `hold` if it is held for
time; the app writes "per side" and the seconds itself.

## How a session is built

The model follows rules it is only told about loosely, so `lib/program.ts`
decides everything that can be decided without it, and the model is asked only
for what needs judgement: which option suits each slot, the numbers for the
strength work, and the coaching cue.

- **Shape.** The minutes she picks fix the number of exercises: 6 for 20
  minutes, 7 for 30, 10 for 45, 13 for an hour.
- **Main lifts.** Moves marked `staple: true` are the foundation lifts. Which
  ones she is on is chosen in code and held for four weeks at a time, so she
  repeats them often enough to feel herself improve. Each card shows what she
  did last time.
- **Balance.** An upper day always has a push and a pull, a lower day a squat
  and a hinge or glute move, a full-body day all three.
- **Rotation.** Everything else changes: what she did last session is left off
  the menu, and each slot gets its own short list that no other slot shares, so
  nothing can appear twice.
- **Difficulty.** She never picks it. A session starts where her last one
  ended, a notch up or down if she said it felt too easy or too hard.
- **Time.** Warm-ups, cardio and stretches are timed by a formula. The finished
  plan is then measured (`lib/timing.ts`) and sets are added or trimmed until it
  fits the minutes she asked for.

Titles are put together in code from a small word list. To change how the
trainer talks, edit `SYSTEM_PROMPT` in `lib/ai.ts`.

## Carrots, levels and badges

All of it is worked out from the workouts she has finished (`lib/progress.ts`);
nothing is stored, so it cannot drift from her history. A finished workout
earns 10 carrots, one more per exercise ticked and 5 for ticking them all.
Three workouts in a week fill the basket for another 15. Weeks count from
Monday, and a streak only breaks once a whole week has passed without one.
Thresholds, level names and badges are all at the top of that file.

Each exercise card shows a bunny doing the move in two pictures, start and
finish. They're drawn from code, not image files: `lib/moves.ts` holds two
poses per catalog id, made of joint angles or "reach this point" targets, and
`lib/figure.ts` explains the coordinates. When you add an exercise, give it a
pair there too; without one, the card simply shows no pictures.

## Adding your own encouragement phrases

Insert more rows into `phrases` — one sentence per row. The mystery box avoids
the last 15 that were used before repeating.
