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

## Adding your own encouragement phrases

Insert more rows into `phrases` — one sentence per row. The mystery box avoids
the last 15 that were used before repeating.
