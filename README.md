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
   `supabase/seed-phrases.sql`.
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
entry's `name`: revisions and swaps match saved exercises by name.

Moves marked `staple: true` are the foundation lifts (squat, deadlift, hip
thrust, rows, presses). The trainer builds each session around them so she
can see herself get stronger. Everything else rotates: the non-staple moves
from her last session are left off the next session's menu, and moves from the
two before that are tagged so the trainer favours fresh ones.

Each exercise card shows a bunny doing the move in two pictures, start and
finish. They're drawn from code, not image files: `lib/moves.ts` holds two
poses per catalog id, made of joint angles or "reach this point" targets, and
`lib/figure.ts` explains the coordinates. When you add an exercise, give it a
pair there too; without one, the card simply shows no pictures.

## Adding your own encouragement phrases

Insert more rows into `phrases` — one sentence per row. The mystery box avoids
the last 15 that were used before repeating.
